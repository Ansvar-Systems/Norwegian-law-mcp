#!/usr/bin/env tsx
/**
 * Official catalog ingestion entrypoint (Norway).
 *
 * Uses official-source IDs from data/relevant-statutes-all.json by default and
 * ingests them through the Lovdata licensing gate.
 *
 * Usage:
 *   npm run ingest:auto-all
 *   npm run ingest:auto-all -- data/relevant-statutes-all.json
 *   npm run ingest:auto-all -- data/relevant-statutes-all.json --metadata-only
 */

import { spawn } from 'child_process';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_CONFIG = path.resolve(__dirname, '../data/relevant-statutes-all.json');
const scriptPath = path.resolve(__dirname, './ingest-relevant-laws-no.ts');

function parseArgs(argv: string[]): { configPath: string; metadataOnly: boolean } {
  const configArg = argv.find(v => !v.startsWith('--'));
  const metadataOnly = argv.includes('--metadata-only');
  return {
    configPath: path.resolve(configArg ?? DEFAULT_CONFIG),
    metadataOnly,
  };
}

async function main(): Promise<void> {
  const { configPath, metadataOnly } = parseArgs(process.argv.slice(2));
  const args = [scriptPath, configPath];
  if (metadataOnly) {
    args.push('--metadata-only');
  }

  console.log('Official catalog ingestion');
  console.log(`  Config: ${configPath}`);
  console.log(`  Mode: ${metadataOnly ? 'metadata-only' : 'full-text (policy-gated)'}`);

  await new Promise<void>((resolve, reject) => {
    const child = spawn(process.execPath, ['--import', 'tsx', ...args], {
      stdio: 'inherit',
      env: process.env,
    });
    child.on('error', reject);
    child.on('exit', code => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`ingest-relevant-laws-no exited with code ${code}`));
      }
    });
  });
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
