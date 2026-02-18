#!/usr/bin/env tsx
/**
 * Extract legal term definitions from Norwegian statutes and populate the definitions table.
 *
 * Identifies definition patterns in provision text and extracts:
 * - term: The legal term being defined
 * - definition: The definition text
 * - source_provision: Which provision it comes from
 * - document_id: Which statute
 *
 * Usage: npm run extract:definitions
 */

import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SEED_DIR = path.resolve(__dirname, '../data/seed');
const DB_PATH = path.resolve(__dirname, '../data/database.db');

interface DocumentSeed {
  id: string;
  type: string;
  title: string;
  short_name?: string;
  provisions?: ProvisionSeed[];
}

interface ProvisionSeed {
  provision_ref: string;
  chapter?: string;
  section: string;
  content: string;
}

interface ExtractedDefinition {
  document_id: string;
  term: string;
  definition: string;
  source_provision: string;
}

// Priority statutes to focus on first
const PRIORITY_STATUTES = [
  'personopplysningsloven.json',
  'offentleglova.json',
  'straffeloven.json',
  'arbeidsmiljoeloven.json',
  'forvaltningsloven.json',
  'aksjeloven.json',
  'plan-og-bygningsloven.json',
  'naturmangfoldloven.json',
  'forurensningsloven.json',
  'anskaffelsesloven.json',
];

/**
 * Definition patterns in Norwegian legal text
 */
const DEFINITION_PATTERNS = [
  // "Med X menes i denne lov/forskrift..." (most common Norwegian)
  {
    regex: /Med\s+([^.]+?)\s+menes\s+i\s+denne\s+(?:lov|forskrift)\s+([^.]+?)\./g,
    termGroup: 1,
    definitionGroup: 2,
  },
  // "Med X menes..." (general)
  {
    regex: /Med\s+([^.]+?)\s+menes\s+([^.]+?)\./g,
    termGroup: 1,
    definitionGroup: 2,
  },
  // "Med X forstås i denne lov/forskrift..."
  {
    regex: /Med\s+([^.]+?)\s+forst(?:å|aa)s\s+i\s+denne\s+(?:lov|forskrift)\s+([^.]+?)\./g,
    termGroup: 1,
    definitionGroup: 2,
  },
  // "Med X forstås..." (general)
  {
    regex: /Med\s+([^.]+?)\s+forst(?:å|aa)s\s+([^.]+?)\./g,
    termGroup: 1,
    definitionGroup: 2,
  },
  // "I denne lov menes med X..." (inverted form)
  {
    regex: /I\s+denne\s+(?:lov|forskrift)\s+menes\s+med\s+([^.]+?)\s+([^.]+?)\./g,
    termGroup: 1,
    definitionGroup: 2,
  },
  // "I loven her menes med X..." (alternative inverted form)
  {
    regex: /I\s+loven\s+her\s+menes\s+med\s+([^.]+?)\s+([^.]+?)\./g,
    termGroup: 1,
    definitionGroup: 2,
  },
];

/**
 * Clean up extracted text
 */
function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n/g, ' ')
    .trim();
}

/**
 * Extract term from a definition phrase
 */
function extractTerm(text: string): string {
  let term = cleanText(text);

  // Remove common prefixes
  term = term.replace(/^(?:i\s+denne\s+(?:lov|forskrift)\s+)?med\s+/i, '');
  term = term.replace(/^i\s+denne\s+(?:lov|forskrift)\s+/i, '');

  // Remove trailing "menes" or "forstås"
  term = term.replace(/\s+(?:menes|forst(?:å|aa)s)$/i, '');

  // Capitalize first letter
  if (term.length > 0) {
    term = term.charAt(0).toUpperCase() + term.slice(1);
  }

  return term;
}

/**
 * Extract definition text, cleaning up artifacts
 */
function extractDefinition(text: string): string {
  let definition = cleanText(text);

  // Remove leading "i denne lov" if present
  definition = definition.replace(/^i\s+denne\s+(?:lov|forskrift|kapittel)\s+/i, '');

  // Remove trailing provision metadata like "Lov (LOV-2018-06-15-38)"
  definition = definition.replace(/\s+Lov\s+\([^)]+\)\.?$/i, '');

  // Ensure definition ends with period
  if (!definition.match(/[.!?]$/)) {
    definition += '.';
  }

  return definition;
}

/**
 * Validate if a definition is high-quality
 */
function isValidDefinition(term: string, definition: string): boolean {
  // Term should be reasonable length
  if (term.length < 3 || term.length > 150) return false;

  // Definition should be substantial
  if (definition.length < 10 || definition.length > 5000) return false;

  // Skip if definition is just a reference
  if (definition.match(/^(?:se|jfr|jämför)\s+\d+/i)) return false;

  // Skip if definition is just a number or enumeration start
  if (definition.match(/^(?:\d+\.?\s*|[a-z]\)\s*)$/)) return false;

  // Skip definitions that are just "i dette kapittel 1" or similar incomplete enumerations
  if (definition.match(/^i\s+(?:dette|denne)\s+(?:kapittel|lov|forskrift)\s+\d+\.?\s*$/i)) return false;

  // Definition should have at least some words (not just references)
  const wordCount = definition.split(/\s+/).filter(w => w.length > 2).length;
  if (wordCount < 3) return false;

  return true;
}

/**
 * Check if a provision likely contains definitions
 */
function isLikelyDefinitionProvision(provision: ProvisionSeed): boolean {
  const content = provision.content.toLowerCase();

  // Contains definition keywords (Norwegian)
  const hasDefinitionKeywords = (
    content.includes('med ') &&
    (content.includes('menes') || content.includes('forstås') || content.includes('forstaas'))
  ) || (
    content.includes('i denne') &&
    (content.includes('menes') || content.includes('forstås'))
  ) || (
    content.includes('definisjoner')
  );

  return hasDefinitionKeywords;
}

/**
 * Extract definitions from a single provision
 */
function extractDefinitionsFromProvision(
  provision: ProvisionSeed,
  documentId: string
): ExtractedDefinition[] {
  const definitions: ExtractedDefinition[] = [];
  const content = provision.content;

  // Try each pattern
  for (const pattern of DEFINITION_PATTERNS) {
    const matches = Array.from(content.matchAll(pattern.regex));

    for (const match of matches) {
      const rawTerm = match[pattern.termGroup];
      const rawDefinition = match[pattern.definitionGroup];

      if (!rawTerm || !rawDefinition) continue;

      const term = extractTerm(rawTerm);
      const definition = extractDefinition(rawDefinition);

      // Validate definition quality
      if (!isValidDefinition(term, definition)) continue;

      definitions.push({
        document_id: documentId,
        term,
        definition,
        source_provision: provision.provision_ref,
      });
    }
  }

  return definitions;
}

/**
 * Extract definitions from a statute document
 */
function extractDefinitionsFromDocument(seed: DocumentSeed): ExtractedDefinition[] {
  const definitions: ExtractedDefinition[] = [];

  if (!seed.provisions) return definitions;

  // Focus on likely definition provisions first (chapter 1, early sections)
  const likelyProvisions = seed.provisions.filter(isLikelyDefinitionProvision);

  for (const provision of likelyProvisions) {
    const extracted = extractDefinitionsFromProvision(provision, seed.id);
    definitions.push(...extracted);
  }

  return definitions;
}

/**
 * Deduplicate definitions (same document + term)
 */
function deduplicateDefinitions(definitions: ExtractedDefinition[]): ExtractedDefinition[] {
  const seen = new Map<string, ExtractedDefinition>();

  for (const def of definitions) {
    const key = `${def.document_id}|${def.term}`;

    if (!seen.has(key)) {
      seen.set(key, def);
    } else {
      // Keep the longer/more detailed definition
      const existing = seen.get(key)!;
      if (def.definition.length > existing.definition.length) {
        seen.set(key, def);
      }
    }
  }

  return Array.from(seen.values());
}

/**
 * Main extraction logic
 */
function extractDefinitions(): void {
  console.log('Extracting legal term definitions from statutes...\n');

  if (!fs.existsSync(SEED_DIR)) {
    console.error(`Seed directory not found: ${SEED_DIR}`);
    process.exit(1);
  }

  // Load all seed files
  const allFiles = fs.readdirSync(SEED_DIR)
    .filter(f => f.endsWith('.json') && !f.startsWith('.') && !f.startsWith('_'));

  // Prioritize key statutes
  const priorityFiles = allFiles.filter(f => PRIORITY_STATUTES.includes(f));
  const otherFiles = allFiles.filter(f => !PRIORITY_STATUTES.includes(f));
  const seedFiles = [...priorityFiles, ...otherFiles];

  console.log(`Found ${seedFiles.length} statute files (${priorityFiles.length} priority)`);

  const allDefinitions: ExtractedDefinition[] = [];
  let processedFiles = 0;

  for (const file of seedFiles) {
    const filePath = path.join(SEED_DIR, file);

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const seed = JSON.parse(content) as DocumentSeed;

      // Skip non-statute documents (case law, etc.)
      if (seed.type !== 'statute') continue;

      const definitions = extractDefinitionsFromDocument(seed);

      if (definitions.length > 0) {
        const shortName = seed.short_name || seed.id;
        console.log(`  ${shortName}: Found ${definitions.length} definitions`);
        allDefinitions.push(...definitions);
      }

      processedFiles++;
    } catch (error) {
      console.error(`  Error processing ${file}:`, error);
    }
  }

  // Deduplicate
  const uniqueDefinitions = deduplicateDefinitions(allDefinitions);
  console.log(`\nExtracted ${uniqueDefinitions.length} unique definitions from ${processedFiles} statutes`);

  // Insert into database
  if (!fs.existsSync(DB_PATH)) {
    console.error(`Database not found: ${DB_PATH}`);
    console.error('Run "npm run build:db" first');
    process.exit(1);
  }

  const db = new Database(DB_PATH);
  db.pragma('foreign_keys = ON');

  const insertDefinition = db.prepare(`
    INSERT OR IGNORE INTO definitions (document_id, term, definition, source_provision)
    VALUES (?, ?, ?, ?)
  `);

  const insertAll = db.transaction(() => {
    let inserted = 0;
    for (const def of uniqueDefinitions) {
      const result = insertDefinition.run(
        def.document_id,
        def.term,
        def.definition,
        def.source_provision
      );
      if (result.changes > 0) inserted++;
    }
    return inserted;
  });

  const inserted = insertAll();
  db.close();

  console.log(`\nInserted ${inserted} definitions into database`);

  // Show sample definitions
  if (uniqueDefinitions.length > 0) {
    console.log('\nSample definitions:');
    for (let i = 0; i < Math.min(5, uniqueDefinitions.length); i++) {
      const def = uniqueDefinitions[i];
      const preview = def.definition.substring(0, 80) + (def.definition.length > 80 ? '...' : '');
      console.log(`  - ${def.term}: ${preview}`);
      console.log(`    (${def.document_id} ${def.source_provision})`);
    }
  }
}

extractDefinitions();
