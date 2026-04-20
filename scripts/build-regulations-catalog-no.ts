#!/usr/bin/env tsx
/**
 * Build a comprehensive catalog of all active Norwegian regulations (forskrifter)
 * by walking the Lovdata sitemap.
 *
 * Output: data/relevant-regulations-all.json
 *
 * Walks https://lovdata.no/sitemap.xml, collects all sub-sitemap pages with
 * base=SF (Sentrale forskrifter, active), and extracts FOR-YYYY-MM-DD-NNN IDs
 * from the per-page entries (same approach the existing relevant-statutes-all.json
 * file was generated with for base=NL/NLO).
 *
 * Usage:
 *   npm run catalog:regulations
 *   npm run catalog:regulations -- --include-opphevet  # also include base=SFO
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { USER_AGENT, sleep } from './ingest-lovdata.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SITEMAP_URL = 'https://lovdata.no/sitemap.xml';
const OUTPUT_PATH = path.resolve(__dirname, '../data/relevant-regulations-all.json');
const REQUEST_DELAY_MS = 600;
const FETCH_RETRIES = 3;

interface CatalogEntry {
  id: string;
  slug: string;
}

async function fetchText(url: string): Promise<string> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= FETCH_RETRIES; attempt++) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/xml,text/xml' },
      });
      if (response.ok) return response.text();
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    if (attempt < FETCH_RETRIES) await sleep(REQUEST_DELAY_MS);
  }
  throw new Error(`Fetch failed after ${FETCH_RETRIES} attempts (${lastError instanceof Error ? lastError.message : lastError}): ${url}`);
}

function decodeAmp(value: string): string {
  return value.replace(/&amp;/g, '&');
}

function extractSubSitemapUrls(indexXml: string, bases: string[]): string[] {
  const urls: string[] = [];
  const locRegex = /<loc>([^<]+)<\/loc>/g;
  let match: RegExpExecArray | null;
  while ((match = locRegex.exec(indexXml)) !== null) {
    const url = decodeAmp(match[1]);
    if (bases.some(b => url.includes(`base=${b}&`))) {
      urls.push(url);
    }
  }
  return urls;
}

// Lovdata regulation URL: https://lovdata.no/dokument/{SF,SFO}/forskrift/YYYY-MM-DD-NNN
const REGULATION_URL_PATTERN = /\/dokument\/(?:SF|SFO)\/forskrift\/(\d{4}-\d{2}-\d{2}(?:-[A-Za-z0-9]+)?)$/;

function extractRegulationEntries(pageXml: string): CatalogEntry[] {
  const entries: CatalogEntry[] = [];
  const locRegex = /<loc>([^<]+)<\/loc>/g;
  let match: RegExpExecArray | null;
  while ((match = locRegex.exec(pageXml)) !== null) {
    const slugMatch = decodeAmp(match[1]).match(REGULATION_URL_PATTERN);
    if (!slugMatch) continue;
    const slug = slugMatch[1];
    entries.push({ id: `FOR-${slug}`.toUpperCase(), slug });
  }
  return entries;
}

async function run(): Promise<void> {
  const flags = new Set(process.argv.slice(2));
  const bases = flags.has('--include-opphevet') ? ['SF', 'SFO'] : ['SF'];

  console.log(`Building Norwegian regulations catalog`);
  console.log(`  Sitemap: ${SITEMAP_URL}`);
  console.log(`  Bases: ${bases.join(', ')}`);
  console.log(`  Output: ${OUTPUT_PATH}\n`);

  const indexXml = await fetchText(SITEMAP_URL);
  const subUrls = extractSubSitemapUrls(indexXml, bases);
  console.log(`Found ${subUrls.length} sub-sitemap pages\n`);

  const all: CatalogEntry[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < subUrls.length; i++) {
    const url = subUrls[i];
    if (i > 0) await sleep(REQUEST_DELAY_MS);
    process.stdout.write(`  [${i + 1}/${subUrls.length}] ${url} ... `);
    try {
      const xml = await fetchText(url);
      const entries = extractRegulationEntries(xml);
      let added = 0;
      for (const entry of entries) {
        if (seen.has(entry.id)) continue;
        seen.add(entry.id);
        all.push(entry);
        added++;
      }
      console.log(`+${added} (running total: ${all.length})`);
    } catch (error) {
      console.log(`FAILED: ${error instanceof Error ? error.message : error}`);
    }
  }

  all.sort((a, b) => a.id.localeCompare(b.id));

  const payload = {
    description: `Full Lovdata regulation catalog (bases: ${bases.join('+')}) extracted from sitemap.`,
    source: SITEMAP_URL,
    generated_at: new Date().toISOString(),
    regulations: all,
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(payload, null, 2), 'utf8');
  console.log(`\nWrote ${all.length} regulations → ${OUTPUT_PATH}`);
}

run().catch(error => {
  console.error('Catalog build failed:', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
