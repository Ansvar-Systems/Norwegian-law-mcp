#!/usr/bin/env tsx
/**
 * Bulk ingest curated Norwegian statutes from official source.
 *
 * Usage:
 *   npm run ingest:relevant
 *   npm run ingest:relevant -- data/relevant-statutes.json
 *   npm run ingest:relevant -- data/relevant-statutes.json --metadata-only
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { ingest } from './ingest-lovdata.js';

interface RelevantStatute {
  id: string;
  slug: string;
}

interface RelevantStatuteConfig {
  description?: string;
  statutes: RelevantStatute[];
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_CONFIG_PATH = path.resolve(__dirname, '../data/relevant-statutes.json');
const DEFAULT_OUTPUT_DIR = path.resolve(__dirname, '../data/seed');

function safeFileName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function parseArgs(argv: string[]): { configPath: string; fullText: boolean } {
  const flags = new Set(argv.filter(v => v.startsWith('--')));
  const configArg = argv.find(v => !v.startsWith('--'));
  const configPath = path.resolve(configArg ?? DEFAULT_CONFIG_PATH);
  const fullText = !flags.has('--metadata-only');
  return { configPath, fullText };
}

async function run(): Promise<void> {
  const { configPath, fullText } = parseArgs(process.argv.slice(2));

  if (!fs.existsSync(configPath)) {
    throw new Error(`Config file not found: ${configPath}`);
  }

  const configRaw = fs.readFileSync(configPath, 'utf8');
  const config = JSON.parse(configRaw) as RelevantStatuteConfig;

  if (!Array.isArray(config.statutes) || config.statutes.length === 0) {
    throw new Error(`No statutes in config: ${configPath}`);
  }

  if (!fs.existsSync(DEFAULT_OUTPUT_DIR)) {
    fs.mkdirSync(DEFAULT_OUTPUT_DIR, { recursive: true });
  }

  console.log('Bulk Ingestion - Relevant Norwegian Statutes');
  console.log(`  Config: ${configPath}`);
  console.log(`  Output dir: ${DEFAULT_OUTPUT_DIR}`);
  console.log(`  Mode: ${fullText ? 'full-text' : 'metadata-only'}`);
  if (config.description) {
    console.log(`  Description: ${config.description}`);
  }
  console.log(`  Total statutes: ${config.statutes.length}\n`);

  const failed: Array<{ id: string; error: string }> = [];
  let completed = 0;

  for (const statute of config.statutes) {
    const slug = safeFileName(statute.slug || statute.id.toLowerCase());
    const outputPath = path.join(DEFAULT_OUTPUT_DIR, `${slug}.json`);

    try {
      await ingest(statute.id, outputPath, { source: 'lovdata', fullText });
      completed++;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failed.push({ id: statute.id, error: message });
      console.error(`FAILED ${statute.id}: ${message}\n`);
    }
  }

  console.log('Bulk ingestion summary');
  console.log(`  Completed: ${completed}`);
  console.log(`  Failed: ${failed.length}`);

  if (failed.length > 0) {
    console.log('\nFailed IDs');
    for (const item of failed) {
      console.log(`  ${item.id} - ${item.error}`);
    }
    process.exitCode = 1;
  } else {
    console.log('\nNext step: npm run build:db');
  }
}

run().catch(error => {
  console.error('Bulk ingestion failed:', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
