#!/usr/bin/env tsx
/**
 * Preparatory Works Ingestion Script
 *
 * Systematically ingests preparatory works (forarbeider) for Norwegian statutes
 * by scraping lovdata.no pages and fetching details from Lovdata API.
 *
 * Pipeline:
 *   lovdata.no -> extract prop/NOU refs -> Lovdata API -> update seed files -> build-db.ts -> database.db
 *
 * Usage:
 *   npm run sync:prep-works
 */

import * as fs from 'fs';
import * as path from 'path';
import { pathToFileURL } from 'url';

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

const REQUEST_DELAY_MS = 500;
const USER_AGENT = 'Norwegian-Law-MCP/0.1.0 (https://github.com/Ansvar-Systems/norwegian-law-mcp)';
const LOVDATA_NO_BASE = 'https://lovdata.no';
const LOVDATA_DOC_URL = 'https://data.Lovdata.se/dokument';
const SEED_DIR = path.resolve(process.cwd(), 'data/seed');
const RELEVANT_STATUTES_PATH = path.resolve(process.cwd(), 'data/relevant-statutes.json');

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface StatuteRef {
  id: string;
  slug: string;
}

interface PrepWorkRef {
  prep_document_id: string;
  title: string;
  summary?: string;
}

interface SeedFile {
  id: string;
  type: string;
  title: string;
  preparatory_works?: PrepWorkRef[];
  [key: string]: unknown;
}

interface LovdataApiDocument {
  dok_id: string;
  titel: string;
  undertitel?: string;
  summary?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'text/html,application/xhtml+xml',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText} for ${url}`);
  }

  return response.text();
}

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText} for ${url}`);
  }

  return response.json();
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function parsePropId(text: string): string | null {
  // Match patterns like "Prop. 2017/18:105" or "2017/18:105"
  const match = text.match(/(?:Prop\.\s*)?(\d{4}\/\d{2}:\d+)/i);
  return match ? match[1] : null;
}

function parseNouId(text: string): string | null {
  // Match patterns like "NOU 2017:39"
  const match = text.match(/NOU\s*(\d{4}:\d+)/i);
  return match ? match[1] : null;
}

function parseOtprpId(text: string): string | null {
  // Match patterns like "Ot.prp. 2017:39"
  const match = text.match(/Ot\.prp\.\s*(\d{4}:\d+)/i);
  return match ? match[1] : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Scraping and extraction
// ─────────────────────────────────────────────────────────────────────────────

async function extractPrepWorkRefsFromLovdata(sfsId: string): Promise<Set<string>> {
  const url = `${LOVDATA_NO_BASE}/${sfsId}`;
  console.log(`  Fetching ${url}...`);

  try {
    const html = await fetchText(url);
    const prepWorkIds = new Set<string>();

    // Extract from "Forarbeider" sections using multiple patterns
    // Pattern 1: Extract proposition and NOU references from preparatory works sections
    const forarbetenMatches = html.matchAll(/<dt>Forarbeider<\/dt>\s*<dd>([^<]*(?:<[^>]+>[^<]*<\/[^>]+>)*[^<]*)<\/dd>/gi);

    for (const match of forarbetenMatches) {
      const content = match[1];

      // Extract Prop references
      const propMatches = content.matchAll(/(?:Prop\.\s*|prop\/)?(\d{4}\/\d{2}:\d+)/gi);
      for (const propMatch of propMatches) {
        prepWorkIds.add(propMatch[1]);
      }

      // Extract NOU references
      const nouMatches = content.matchAll(/NOU\s*(\d{4}:\d+)/gi);
      for (const nouMatch of nouMatches) {
        prepWorkIds.add(nouMatch[1]);
      }

      // Extract Ot.prp. references
      const otprpMatches = content.matchAll(/Ot\.prp\.\s*(\d{4}:\d+)/gi);
      for (const otprpMatch of otprpMatches) {
        prepWorkIds.add(otprpMatch[1]);
      }
    }

    // Pattern 2: Extract from proposition links in the document
    const propLinkMatches = html.matchAll(/href="https:\/\/lovdata\.no\/.*?prop\/(\d{4}\/\d{2}:\d+)/gi);
    for (const match of propLinkMatches) {
      prepWorkIds.add(match[1]);
    }

    // Pattern 3: Extract from LOV amendment notes that include propositions
    const amendmentMatches = html.matchAll(/\(Prop\.\s*(\d{4}\/\d{2}:\d+):/gi);
    for (const match of amendmentMatches) {
      prepWorkIds.add(match[1]);
    }

    console.log(`  Found ${prepWorkIds.size} preparatory work references`);
    return prepWorkIds;
  } catch (error) {
    console.error(`  ERROR: Failed to fetch ${url}: ${error instanceof Error ? error.message : String(error)}`);
    return new Set();
  }
}

async function fetchPrepWorkDetails(prepDocId: string): Promise<PrepWorkRef | null> {
  // Determine document type
  let doktyp: string;
  let searchTerm: string;

  if (prepDocId.includes('/')) {
    // Proposition format: 2017/18:105
    doktyp = 'prop';
    searchTerm = prepDocId;
  } else if (prepDocId.match(/^\d{4}:\d+$/)) {
    // Could be NOU or Ot.prp.
    // Try NOU first
    doktyp = 'sou';
    searchTerm = prepDocId;
  } else {
    console.log(`  WARNING: Unknown preparatory work format: ${prepDocId}`);
    return null;
  }

  try {
    // Search for the document
    const listUrl = `https://data.Lovdata.se/dokumentlista/?sok=${encodeURIComponent(searchTerm)}&doktyp=${doktyp}&format=json&utformat=json`;
    console.log(`    Searching Lovdata for ${prepDocId}...`);

    await delay(REQUEST_DELAY_MS);
    const listData = await fetchJson(listUrl) as { dokumentlista?: { dokument?: LovdataApiDocument[] } };
    const documents = listData?.dokumentlista?.dokument ?? [];

    if (documents.length === 0) {
      // If NOU search failed and we have a numeric ID, try Ot.prp.
      if (doktyp === 'sou' && prepDocId.match(/^\d{4}:\d+$/)) {
        console.log(`    NOU not found, trying Ot.prp....`);
        const otprpListUrl = `https://data.Lovdata.se/dokumentlista/?sok=${encodeURIComponent(searchTerm)}&doktyp=ds&format=json&utformat=json`;
        await delay(REQUEST_DELAY_MS);
        const otprpListData = await fetchJson(otprpListUrl) as { dokumentlista?: { dokument?: LovdataApiDocument[] } };
        const otprpDocuments = otprpListData?.dokumentlista?.dokument ?? [];

        if (otprpDocuments.length > 0) {
          doktyp = 'ds';
          documents.push(...otprpDocuments);
        }
      }

      if (documents.length === 0) {
        console.log(`    WARNING: No documents found for ${prepDocId}`);
        return null;
      }
    }

    // Take the first match
    const doc = documents[0];

    // Format the title properly
    let title: string;
    if (doktyp === 'prop') {
      title = `Proposition ${prepDocId}${doc.titel ? ': ' + normalizeWhitespace(doc.titel) : ''}`;
    } else if (doktyp === 'sou') {
      title = `NOU ${prepDocId}${doc.titel ? ': ' + normalizeWhitespace(doc.titel) : ''}`;
    } else if (doktyp === 'ds') {
      title = `Ot.prp. ${prepDocId}${doc.titel ? ': ' + normalizeWhitespace(doc.titel) : ''}`;
    } else {
      title = normalizeWhitespace(doc.titel || prepDocId);
    }

    // Extract summary if available
    const summary = doc.undertitel
      ? normalizeWhitespace(doc.undertitel)
      : undefined;

    console.log(`    Found: ${title}`);

    return {
      prep_document_id: prepDocId,
      title,
      summary,
    };
  } catch (error) {
    console.error(`    ERROR: Failed to fetch details for ${prepDocId}: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Seed file management
// ─────────────────────────────────────────────────────────────────────────────

function getSeedFilePath(sfsId: string, slug?: string): string {
  // Try slug-based name first (e.g., dataskyddslagen.json)
  if (slug) {
    const slugPath = path.join(SEED_DIR, slug + '.json');
    if (fs.existsSync(slugPath)) {
      return slugPath;
    }
  }

  // Fall back to LOV ID-based name (e.g., 2018_218.json)
  const filename = sfsId.replace(':', '_') + '.json';
  return path.join(SEED_DIR, filename);
}

function loadSeedFile(sfsId: string, slug?: string): SeedFile | null {
  const filePath = getSeedFilePath(sfsId, slug);
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as SeedFile;
  } catch (error) {
    console.error(`  ERROR: Failed to load seed file ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

function saveSeedFile(seed: SeedFile, slug?: string): void {
  const filePath = getSeedFilePath(seed.id, slug);

  // Ensure directory exists
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(filePath, JSON.stringify(seed, null, 2));
}

// ─────────────────────────────────────────────────────────────────────────────
// Main ingestion logic
// ─────────────────────────────────────────────────────────────────────────────

async function ingestPreparatoryWorks(): Promise<void> {
  console.log('Preparatory Works Ingestion');
  console.log('═'.repeat(80));
  console.log('');

  // Load relevant statutes
  if (!fs.existsSync(RELEVANT_STATUTES_PATH)) {
    console.error(`ERROR: Relevant statutes file not found: ${RELEVANT_STATUTES_PATH}`);
    process.exit(1);
  }

  const relevantStatutes = JSON.parse(fs.readFileSync(RELEVANT_STATUTES_PATH, 'utf-8')) as {
    statutes: StatuteRef[];
  };

  console.log(`Found ${relevantStatutes.statutes.length} statutes to process`);
  console.log('');

  let totalStatutesProcessed = 0;
  let totalPrepWorksFound = 0;
  let totalPrepWorksAdded = 0;
  let totalSeedFilesUpdated = 0;

  for (const statute of relevantStatutes.statutes) {
    console.log(`Processing ${statute.id} (${statute.slug})...`);
    totalStatutesProcessed++;

    // Load existing seed file (try slug first, then LOV ID)
    const seedFile = loadSeedFile(statute.id, statute.slug);
    if (!seedFile) {
      console.log(`  WARNING: Seed file not found for ${statute.id}, skipping`);
      console.log('');
      continue;
    }

    // Get existing preparatory works
    const existingPrepWorks = seedFile.preparatory_works ?? [];
    const existingIds = new Set(existingPrepWorks.map(pw => pw.prep_document_id));

    // Extract preparatory work references from lovdata.no
    const prepWorkIds = await extractPrepWorkRefsFromLovdata(statute.id);
    await delay(REQUEST_DELAY_MS);

    if (prepWorkIds.size === 0) {
      console.log(`  No preparatory works found`);
      console.log('');
      continue;
    }

    totalPrepWorksFound += prepWorkIds.size;

    // Fetch details for each preparatory work
    const newPrepWorks: PrepWorkRef[] = [];
    for (const prepDocId of prepWorkIds) {
      // Skip if already exists
      if (existingIds.has(prepDocId)) {
        console.log(`  Skipping ${prepDocId} (already exists)`);
        continue;
      }

      const prepWork = await fetchPrepWorkDetails(prepDocId);
      if (prepWork) {
        newPrepWorks.push(prepWork);
        totalPrepWorksAdded++;
      }
      await delay(REQUEST_DELAY_MS);
    }

    // Update seed file if we found new preparatory works
    if (newPrepWorks.length > 0) {
      seedFile.preparatory_works = [...existingPrepWorks, ...newPrepWorks];
      saveSeedFile(seedFile, statute.slug);
      totalSeedFilesUpdated++;
      console.log(`  ✓ Added ${newPrepWorks.length} preparatory works to seed file`);
    } else {
      console.log(`  No new preparatory works to add`);
    }

    console.log('');
  }

  console.log('═'.repeat(80));
  console.log('Ingestion Summary:');
  console.log(`  Statutes processed: ${totalStatutesProcessed}`);
  console.log(`  Total preparatory work references found: ${totalPrepWorksFound}`);
  console.log(`  New preparatory works added: ${totalPrepWorksAdded}`);
  console.log(`  Seed files updated: ${totalSeedFilesUpdated}`);
  console.log('');
  console.log('Next step: npm run build:db');
}

// ─────────────────────────────────────────────────────────────────────────────
// CLI
// ─────────────────────────────────────────────────────────────────────────────

const isMainModule = process.argv[1] != null && pathToFileURL(process.argv[1]).href === import.meta.url;

if (isMainModule) {
  ingestPreparatoryWorks().catch(error => {
    console.error('Ingestion failed:', error.message);
    process.exit(1);
  });
}
