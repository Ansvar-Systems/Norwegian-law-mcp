#!/usr/bin/env tsx
/**
 * Lovdata statute ingestion with licensing-compliance gate.
 *
 * Usage:
 *   npm run ingest -- LOV-2018-06-15-38 data/seed/LOV-2018-06-15-38.json
 *   npm run ingest -- LOV-2018-06-15-38 data/seed/LOV-2018-06-15-38.json --metadata-only
 *   npm run ingest -- LOV-2018-06-15-38 data/seed/LOV-2018-06-15-38.json --source=lovdata
 */

import { JSDOM } from 'jsdom';
import * as fs from 'fs';
import * as path from 'path';
import { execFileSync } from 'child_process';
import { pathToFileURL } from 'url';
import { decideIngestionMode, type LegalSource } from './lib/legal-data-license.js';

interface SeedProvision {
  provision_ref: string;
  chapter?: string;
  section: string;
  title?: string;
  content: string;
  metadata?: Record<string, unknown>;
}

interface SeedDocument {
  id: string;
  type: 'statute';
  title: string;
  title_en?: string;
  short_name?: string;
  status: 'in_force' | 'amended' | 'repealed' | 'not_yet_in_force';
  issued_date?: string;
  in_force_date?: string;
  url: string;
  description: string;
  provisions?: SeedProvision[];
  provision_versions?: SeedProvision[];
}

export interface IngestOptions {
  source?: LegalSource;
  fullText?: boolean;
  htmlFile?: string;
}

interface CliArgs {
  identifier: string;
  outputPath: string;
  source: LegalSource;
  wantsFullText: boolean;
  htmlFile?: string;
}

const USER_AGENT = 'Norwegian-Law-MCP/1.0.0 (+https://github.com/Ansvar-Systems/norwegian-law-mcp)';
const LOV_ID_PATTERN = /^LOV-(\d{4})-(\d{2})-(\d{2})(?:-([A-Za-z0-9]+))?$/i;
const REQUEST_RETRIES = 3;
const REQUEST_RETRY_DELAY_MS = 600;

function parseArgs(argv: string[]): CliArgs {
  if (argv.length < 2) {
    console.error(
      'Usage: npm run ingest -- <LOV-YYYY-MM-DD[-NNN]> <output-path> ' +
      '[--source=lovdata|lovtidend|domstol] [--metadata-only|--full-text]'
    );
    process.exit(1);
  }

  const [identifier, outputPath, ...flags] = argv;
  let source: LegalSource = 'lovdata';
  let wantsFullText = true;
  let htmlFile: string | undefined;

  for (const flag of flags) {
    if (flag === '--metadata-only') {
      wantsFullText = false;
      continue;
    }

    if (flag === '--full-text') {
      wantsFullText = true;
      continue;
    }

    if (flag.startsWith('--source=')) {
      const value = flag.slice('--source='.length) as LegalSource;
      if (value === 'lovdata' || value === 'lovtidend' || value === 'domstol') {
        source = value;
      } else {
        console.error(`Unsupported source: ${value}`);
        process.exit(1);
      }
    }

    if (flag.startsWith('--html-file=')) {
      htmlFile = path.resolve(flag.slice('--html-file='.length));
    }
  }

  return { identifier, outputPath, source, wantsFullText, htmlFile };
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function normalizeSectionRef(value: string): string {
  const cleaned = value.replace(/[.§]/g, '').trim();
  const alpha = cleaned.match(/^(\d+)\s*([A-Za-zÆØÅæøå])$/);
  if (alpha) {
    return `${alpha[1]} ${alpha[2].toLowerCase()}`;
  }
  return cleaned;
}

function parseNorwegianDate(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  const match = value.match(/\b(\d{2})\.(\d{2})\.(\d{4})\b/);
  if (!match) {
    return undefined;
  }
  return `${match[3]}-${match[2]}-${match[1]}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function parseLovIdentifier(identifier: string): {
  canonicalId: string;
  slug: string;
  issuedDate: string;
} {
  const match = identifier.match(LOV_ID_PATTERN);
  if (!match) {
    throw new Error(`Invalid identifier "${identifier}". Expected LOV-YYYY-MM-DD[-NNN].`);
  }

  const [, year, month, day, suffix] = match;
  const normalizedSuffix = suffix ? suffix.toLowerCase() : undefined;
  const slug = normalizedSuffix ? `${year}-${month}-${day}-${normalizedSuffix}` : `${year}-${month}-${day}`;
  return {
    canonicalId: `LOV-${slug}`.toUpperCase(),
    slug,
    issuedDate: `${year}-${month}-${day}`,
  };
}

function buildLovdataCandidates(slug: string): string[] {
  const base = [
    `https://lovdata.no/dokument/NL/lov/${slug}`,
    `https://lovdata.no/dokument/NLO/lov/${slug}`,
    `https://lovdata.no/dokument/LTI/lov/${slug}`,
  ];

  return [
    ...base.map(url => `${url}/*`),
    ...base,
  ];
}

async function fetchHtml(url: string): Promise<string | null> {
  for (let attempt = 1; attempt <= REQUEST_RETRIES; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'text/html,application/xhtml+xml',
        },
      });

      if (!response.ok) {
        if (attempt < REQUEST_RETRIES) {
          await sleep(REQUEST_RETRY_DELAY_MS);
          continue;
        }
        return null;
      }

      return await response.text();
    } catch {
      if (attempt < REQUEST_RETRIES) {
        await sleep(REQUEST_RETRY_DELAY_MS);
        continue;
      }
      return null;
    }
  }

  try {
    const output = execFileSync(
      'curl',
      [
        '-sS',
        '-L',
        '--max-time',
        '30',
        '-A',
        USER_AGENT,
        '-H',
        'Accept: text/html,application/xhtml+xml',
        url,
      ],
      {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
        maxBuffer: 32 * 1024 * 1024,
      }
    );
    return output || null;
  } catch {
    // fall through
  }

  return null;
}

async function fetchFirstAvailableHtml(candidates: string[]): Promise<{ url: string; html: string } | null> {
  for (const url of candidates) {
    const html = await fetchHtml(url);
    if (!html) {
      continue;
    }
    if (!html.includes('<html')) {
      continue;
    }
    return { url, html };
  }
  return null;
}

function extractMetaFields(document: Document): Record<string, string> {
  const metadata: Record<string, string> = {};
  const rows = Array.from(document.querySelectorAll('#documentMeta tr'));

  for (const row of rows) {
    const label = normalizeWhitespace((row.querySelector('th')?.textContent ?? '').replace(/:$/, ''));
    const value = normalizeWhitespace(row.querySelector('td')?.textContent ?? '');
    if (label && value) {
      metadata[label] = value;
    }
  }

  return metadata;
}

function extractTitle(document: Document): string | undefined {
  const title = normalizeWhitespace(document.querySelector('#documentMeta h1')?.textContent ?? '');
  if (title) {
    return title;
  }

  const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content');
  const normalized = normalizeWhitespace(ogTitle ?? '');
  return normalized || undefined;
}

function inferStatus(title: string | undefined, metadata: Record<string, string>): SeedDocument['status'] {
  const text = [title, metadata['Opphevet'], metadata['Status']].filter(Boolean).join(' ');
  if (/opphevet/i.test(text)) {
    return 'repealed';
  }
  return 'in_force';
}

function extractTableText(table: Element): string[] {
  const rows = Array.from(table.querySelectorAll('tr'));
  if (rows.length === 0) {
    const fallback = normalizeWhitespace(table.textContent ?? '');
    return fallback ? [fallback] : [];
  }

  const parts: string[] = [];
  for (const row of rows) {
    const cells = Array.from(row.querySelectorAll('td'));
    if (cells.length === 0) {
      const fallback = normalizeWhitespace(row.textContent ?? '');
      if (fallback) {
        parts.push(fallback);
      }
      continue;
    }

    if (cells.length === 1) {
      const only = normalizeWhitespace(cells[0]?.textContent ?? '');
      if (only) {
        parts.push(only);
      }
      continue;
    }

    const marker = normalizeWhitespace(cells[0]?.textContent ?? '');
    const body = normalizeWhitespace(cells[cells.length - 1]?.textContent ?? '');
    if (!body && marker) {
      parts.push(marker);
      continue;
    }
    if (!marker) {
      parts.push(body);
      continue;
    }
    if (marker === body) {
      parts.push(body);
      continue;
    }
    if (marker.length <= 16) {
      parts.push(`${marker} ${body}`);
    } else {
      parts.push(body);
    }
  }

  return parts;
}

function extractProvisionContent(paragraph: Element): string {
  const blocks = Array.from(paragraph.children)
    .filter(child => child.matches('p.avsnitt, table.avsnitt, table.listeItem, div.tabell'));

  const sourceBlocks = blocks.length > 0
    ? blocks
    : Array.from(paragraph.querySelectorAll(':scope p.avsnitt, :scope table.avsnitt, :scope table.listeItem, :scope div.tabell'));

  const parts: string[] = [];
  for (const block of sourceBlocks) {
    if (block.matches('table.avsnitt, table.listeItem')) {
      parts.push(...extractTableText(block));
      continue;
    }

    const text = normalizeWhitespace(block.textContent ?? '');
    if (text) {
      parts.push(text);
    }
  }

  if (parts.length === 0) {
    const fallback = normalizeWhitespace(paragraph.textContent ?? '');
    if (fallback) {
      return fallback;
    }
  }

  const unique: string[] = [];
  const seen = new Set<string>();
  for (const part of parts) {
    if (!part || seen.has(part)) {
      continue;
    }
    seen.add(part);
    unique.push(part);
  }

  return unique.join('\n').trim();
}

function choosePreferredProvision(current: SeedProvision, candidate: SeedProvision): SeedProvision {
  const currentScore = normalizeWhitespace(current.content).length;
  const candidateScore = normalizeWhitespace(candidate.content).length;
  return candidateScore > currentScore ? candidate : current;
}

function extractProvisions(document: Document): SeedProvision[] {
  const nodes = Array.from(
    document.querySelectorAll('div.morTag_p.paragraf[data-id]')
  );

  const byRef = new Map<string, SeedProvision>();
  const order: string[] = [];

  for (const node of nodes) {
    const dataId = node.getAttribute('data-id') ?? '';
    const sectionMatch = dataId.match(/^PARAGRAF_(\d+[A-Za-zÆØÅæøå]?)$/);
    if (!sectionMatch) {
      continue;
    }

    const section = normalizeSectionRef(sectionMatch[1]);

    const chapterContainer = node.closest('div.kapittel[data-id]');
    const chapterMatch = chapterContainer?.getAttribute('data-id')?.match(/^KAPITTEL_(\d+[A-Za-zÆØÅæøå]?)$/);
    const chapter = chapterMatch ? normalizeSectionRef(chapterMatch[1]) : undefined;

    const headerValue = normalizeWhitespace(node.querySelector('.paragrafValue')?.textContent ?? '');
    const title = normalizeWhitespace(node.querySelector('.paragrafTittel')?.textContent ?? '');
    const content = extractProvisionContent(node);

    if (!content) {
      continue;
    }

    const provisionRef = chapter ? `${chapter}:${section}` : section;
    const provision: SeedProvision = {
      provision_ref: provisionRef,
      chapter,
      section,
      title: title || undefined,
      content,
      metadata: {
        source: 'lovdata',
        source_node_id: dataId,
        source_heading: headerValue || undefined,
      },
    };

    const existing = byRef.get(provisionRef);
    if (!existing) {
      byRef.set(provisionRef, provision);
      order.push(provisionRef);
      continue;
    }
    byRef.set(provisionRef, choosePreferredProvision(existing, provision));
  }

  return order.map(ref => byRef.get(ref)!).filter(Boolean);
}

export async function ingest(identifier: string, outputPath: string, options: IngestOptions = {}): Promise<SeedDocument> {
  const source = options.source ?? 'lovdata';
  const wantsFullText = options.fullText ?? true;
  const decision = decideIngestionMode(source, wantsFullText);
  let effectiveMode: 'full_text' | 'metadata_only' = decision.mode;
  let extractionFallbackReason: string | null = null;
  const parsed = parseLovIdentifier(identifier);
  let html: string | null = null;
  let sourceUrl = `https://lovdata.no/dokument/NL/lov/${parsed.slug}`;

  if (options.htmlFile) {
    if (!fs.existsSync(options.htmlFile)) {
      throw new Error(`Local HTML file not found: ${options.htmlFile}`);
    }
    html = fs.readFileSync(options.htmlFile, 'utf8');
  } else {
    const candidates = buildLovdataCandidates(parsed.slug);
    const fetched = await fetchFirstAvailableHtml(candidates);
    if (!fetched) {
      throw new Error(`Failed to fetch official source for ${identifier}`);
    }
    html = fetched.html;
    sourceUrl = fetched.url.replace(/\/\*$/, '');
  }

  const dom = new JSDOM(html);
  const document = dom.window.document;

  const metadata = extractMetaFields(document);
  const title = extractTitle(document) ?? `Norwegian statute ${parsed.canonicalId}`;
  const shortName = normalizeWhitespace(metadata['Korttittel'] ?? '');
  const issuedDate = parsed.issuedDate;
  const inForceDate = parseNorwegianDate(metadata['Ikrafttredelse']) ?? issuedDate;
  const status = inferStatus(title, metadata);
  const canonicalUrl = sourceUrl;

  let provisions: SeedProvision[] | undefined;
  if (decision.mode === 'full_text') {
    provisions = extractProvisions(document);
    if (provisions.length === 0) {
      // Some legacy/non-standard documents do not expose parsable provision blocks.
      // Fall back to metadata-only to preserve catalog coverage.
      provisions = undefined;
      effectiveMode = 'metadata_only';
      extractionFallbackReason = 'Full-text parsing unavailable for this document structure; stored as metadata with deep link.';
    }
  }

  const descriptionParts = [
    `Ingestion mode: ${effectiveMode}.`,
    decision.reason,
    `Attribution: ${decision.policy.required_attribution}.`,
    effectiveMode === 'metadata_only'
      ? 'Policy: metadata + stable deep links with fetch-on-demand full text.'
      : 'Policy: full-text statute ingestion permitted for this source scope.',
  ];
  if (extractionFallbackReason) {
    descriptionParts.push(extractionFallbackReason);
  }

  const seed: SeedDocument = {
    id: parsed.canonicalId,
    type: 'statute',
    title,
    short_name: shortName || undefined,
    status,
    issued_date: issuedDate,
    in_force_date: inForceDate,
    url: canonicalUrl,
    description: descriptionParts.join(' '),
    provisions: provisions && provisions.length > 0 ? provisions : undefined,
    provision_versions: provisions && provisions.length > 0 ? provisions : undefined,
  };

  const outDir = path.dirname(outputPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  fs.writeFileSync(outputPath, JSON.stringify(seed, null, 2), 'utf-8');

  console.log(`Wrote ${outputPath}`);
  console.log(`  Source URL: ${canonicalUrl}`);
  console.log(`  License mode: ${effectiveMode}`);
  console.log(`  Provisions: ${seed.provisions?.length ?? 0}`);

  return seed;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  await ingest(args.identifier, args.outputPath, {
    source: args.source,
    fullText: args.wantsFullText,
    htmlFile: args.htmlFile,
  });
}

const isCliEntrypoint = process.argv[1]
  ? import.meta.url === pathToFileURL(process.argv[1]).href
  : false;

if (isCliEntrypoint) {
  main().catch(error => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Ingestion failed: ${message}`);
    process.exit(1);
  });
}
