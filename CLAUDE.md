# CLAUDE.md

> Instructions for Claude Code when working on Norwegian Law MCP

## Project Overview

This is an MCP server providing Norwegian legal citation tools — searching statutes (lover), case law (rettsavgjorelser), preparatory works (forarbeider), and validating citations. Built with TypeScript and SQLite FTS5 for full-text search.

**Core principle: Verified data only** — the server NEVER generates citations, only returns data verified against authoritative Norwegian legal sources (Lovdata). All database entries are validated during ingestion.

**Data Sources:**
- Lovdata (Stiftelsen Lovdata) — Official Norwegian legal portal
- Norsk Lovtidend / Lovsamlingen — Norwegian Code of Statutes
- EUR-Lex — Official EU legislation database (metadata, for EEA cross-references)

## Architecture

```
src/
├── index.ts                 # MCP server entry point (stdio transport, delegates to registry)
├── capabilities.ts          # Server capability declarations
├── types/
│   ├── index.ts             # Re-exports all types
│   ├── documents.ts         # LegalDocument, DocumentType, DocumentStatus
│   ├── provisions.ts        # LegalProvision, ProvisionRef, CrossReference
│   ├── citations.ts         # ParsedCitation, CitationFormat, ValidationResult
│   └── eu-references.ts     # EU reference types
├── citation/
│   ├── parser.ts            # Parse citation strings (LOV, Prop., NOU, HR, etc.)
│   ├── formatter.ts         # Format citations per Norwegian conventions
│   └── validator.ts         # Validate citations against database
├── parsers/
│   ├── provision-parser.ts      # Parse raw statute text into provisions
│   ├── cross-ref-extractor.ts   # Extract cross-references from text
│   ├── eu-reference-parser.ts   # Extract EU references from Norwegian statute text
│   ├── amendment-parser.ts      # Parse amendment information
│   └── lovdata-provision-parser.ts    # Provision parser for Lovdata-sourced text
├── utils/
│   ├── as-of-date.ts        # Date handling utilities
│   ├── fts-query.ts         # FTS5 query sanitization
│   └── metadata.ts          # Response metadata generation
└── tools/
    ├── registry.ts              # Centralized tool definitions + registration
    ├── search-legislation.ts    # search_legislation - FTS5 provision search
    ├── get-provision.ts         # get_provision - Retrieve specific provision
    ├── search-case-law.ts       # search_case_law - FTS5 case law search
    ├── get-preparatory-works.ts # get_preparatory_works - Linked forarbeider
    ├── validate-citation.ts     # validate_citation - Zero-hallucination check
    ├── build-legal-stance.ts    # build_legal_stance - Multi-source aggregation
    ├── format-citation.ts       # format_citation - Citation formatting
    ├── check-currency.ts        # check_currency - Is statute in force?
    ├── get-eu-basis.ts          # get_eu_basis - EU law for Norwegian statute
    ├── get-norwegian-implementations.ts # get_norwegian_implementations - Norwegian laws for EU act
    ├── search-eu-implementations.ts   # search_eu_implementations - Search EU documents
    ├── get-provision-eu-basis.ts      # get_provision_eu_basis - EU basis for provision
    ├── validate-eu-compliance.ts      # validate_eu_compliance - EU compliance check
    ├── list-sources.ts          # list_sources - Data provenance
    └── about.ts                 # about - Server metadata

api/
├── mcp.ts                   # Streamable HTTP transport (Vercel)
└── health.ts                # Health endpoint

scripts/
├── build-db.ts              # Build SQLite database from seed files
├── ingest-lovdata.ts        # Ingest statutes from Lovdata
├── ingest-riksdagen.ts      # Legacy Swedish ingestion script (deprecated)
├── ingest-official-catalog-no.ts    # Ingest official Norwegian statute catalog
├── ingest-relevant-laws-no.ts       # Ingest relevant Norwegian laws
├── ingest-case-law-metadata-no.ts   # Ingest Norwegian case law metadata
├── sync-case-law-metadata-no.ts     # Sync Norwegian case law metadata
├── sync-preparatory-works-no.ts     # Sync Norwegian preparatory works
├── ingest-preparatory-works.ts      # Ingest preparatory works
├── extract-eu-references.ts         # Extract EU references from statutes
├── fetch-eurlex-metadata.ts         # Fetch EU document metadata from EUR-Lex
├── import-eurlex-documents.ts       # Import EUR-Lex documents into database
├── migrate-eu-references.ts         # Migrate EU references from seed files
├── verify-eu-coverage.ts            # Verify EU reference coverage
├── check-updates.ts                 # Check for statute amendments
├── drift-detect.ts                  # Detect data drift
├── extract-definitions.ts           # Extract legal definitions
├── audit-seeds.ts                   # Audit seed file integrity
├── lib/
│   ├── legal-data-license.ts        # License gate for legal data
│   └── lagennu-parser.ts            # Legacy Swedish parser (deprecated)
└── ...                              # Additional utility scripts

tests/
├── capabilities.test.ts     # Server capability tests
├── fixtures/                # In-memory SQLite with Norwegian law sample data
├── citation/                # Parser, formatter, validator tests
├── parsers/                 # Provision parser tests
├── integration/             # Integration tests
└── tools/                   # Tool-level integration tests

__tests__/
└── contract/golden.test.ts  # Golden contract tests (12 tests)

data/
├── seed/                    # JSON seed files per document
└── database.db              # SQLite database (87 MB)
```

## MCP Tools (15)

### Core Legal Research Tools (8)

| Tool | Description |
|------|-------------|
| `search_legislation` | FTS5 search on provision text with BM25 ranking |
| `get_provision` | Retrieve specific provision by LOV id + chapter/section |
| `search_case_law` | FTS5 search on case law with court/date filters |
| `get_preparatory_works` | Get linked propositions and NOUs for a statute |
| `validate_citation` | Validate citation against database (zero-hallucination check) |
| `build_legal_stance` | Aggregate citations from statutes, case law, prep works |
| `format_citation` | Format citations (full/short/pinpoint) |
| `check_currency` | Check if statute is in force, amended, or repealed |

### EU Law Integration Tools (5)

| Tool | Description |
|------|-------------|
| `get_eu_basis` | Get EU directives/regulations for Norwegian statute |
| `get_norwegian_implementations` | Find Norwegian laws implementing EU act |
| `search_eu_implementations` | Search EU documents with Norwegian implementation counts |
| `get_provision_eu_basis` | Get EU law references for specific provision |
| `validate_eu_compliance` | Check EU compliance status |

### Metadata Tools (2)

| Tool | Description |
|------|-------------|
| `list_sources` | Data source provenance metadata |
| `about` | Server metadata, dataset statistics, freshness |

## Norwegian Law Structure

Norwegian statutes follow this structure:
- **LOV id**: e.g., "LOV-2018-06-15-38" (LOV-YYYY-MM-DD-number)
- **Chapters** (Kapittel): Major divisions, e.g., "kapittel 3"
- **Sections** (Paragrafer): Individual provisions, marked with §
- **Paragraphs** (Ledd): Within sections

Citation formats:
- Full: `LOV LOV-2018-06-15-38 kapittel 3 § 5`
- Short: `LOV-2018-06-15-38 § 5`
- Chapter+section: `LOV-2018-06-15-38 3:5` (Kapittel 3 § 5)
- Proposition: `Prop.56 L (2017-2018)` or `Ot.prp. nr. 98 (2008-2009)`
- NOU: `NOU 2009:1`
- Case law: `HR-2020-1234-A`, `Rt. 2015 s. 1250`

## Key Commands

```bash
# Development
npm run dev              # Run server with hot reload
npm run build            # Compile TypeScript
npm test                 # Run tests (vitest)

# Data Management
npm run ingest -- <LOV-ID> <output.json>  # Ingest statute from Lovdata
npm run build:db                           # Rebuild database from seed/
npm run check-updates                      # Check for amendments

# Testing
npx @anthropic/mcp-inspector node dist/index.js
```

## Database Schema

```sql
-- All legal documents (statutes, case law)
CREATE TABLE legal_documents (
  id TEXT PRIMARY KEY,          -- LOV id (e.g., LOV-2018-06-15-38) or doc ID
  type TEXT NOT NULL,           -- statute|bill|sou|ds|case_law
  title TEXT NOT NULL,
  title_en TEXT,
  short_name TEXT,              -- e.g., "popplyl", "strl"
  status TEXT NOT NULL,         -- in_force|amended|repealed|not_yet_in_force
  issued_date TEXT,
  in_force_date TEXT,
  url TEXT,
  description TEXT,
  last_updated TEXT
);

-- Individual provisions from statutes
CREATE TABLE legal_provisions (
  id INTEGER PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES legal_documents(id),
  provision_ref TEXT NOT NULL,  -- e.g., "3:5" or "5 a"
  chapter TEXT,
  section TEXT NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  metadata TEXT,                -- JSON
  UNIQUE(document_id, provision_ref)
);

-- EU directives and regulations
CREATE TABLE eu_documents (
  id TEXT PRIMARY KEY,          -- "directive:2016/679" or "regulation:2016/679"
  type TEXT NOT NULL,           -- "directive" | "regulation"
  year INTEGER NOT NULL,
  number INTEGER NOT NULL,
  community TEXT,               -- "EU" | "EG" | "EEG" | "Euratom"
  celex_number TEXT,            -- EUR-Lex standard (e.g., "32016R0679")
  title TEXT,
  title_en TEXT,
  short_name TEXT,              -- "GDPR", "eIDAS", etc.
  in_force BOOLEAN DEFAULT 1,
  adoption_date TEXT,
  url TEXT,                     -- EUR-Lex URL
  UNIQUE(type, year, number)
);

-- Norwegian statute → EU cross-references (EEA implementation)
CREATE TABLE eu_references (
  id INTEGER PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES legal_documents(id),  -- Norwegian LOV id
  provision_id INTEGER REFERENCES legal_provisions(id),      -- Optional provision link
  eu_document_id TEXT NOT NULL REFERENCES eu_documents(id),  -- EU directive/regulation
  eu_article TEXT,              -- "6.1.c", "13-15", etc.
  reference_type TEXT,          -- "implements", "supplements", "applies", etc.
  is_primary_implementation BOOLEAN DEFAULT 0,
  context TEXT,                 -- Surrounding Norwegian text
  UNIQUE(document_id, provision_id, eu_document_id, eu_article)
);

-- FTS5 indexes (content-synced with triggers)
CREATE VIRTUAL TABLE provisions_fts USING fts5(...);
CREATE VIRTUAL TABLE case_law_fts USING fts5(...);
CREATE VIRTUAL TABLE prep_works_fts USING fts5(...);
CREATE VIRTUAL TABLE definitions_fts USING fts5(...);

-- See scripts/build-db.ts for full schema
```

## EU Integration Architecture

### Bi-Directional Reference Model (via EEA Agreement)

```
Norwegian Statute <-> EU Directive/Regulation
       |                        |
  Provisions              EU Articles
       |                        |
    Case Law              CJEU (future)
```

### Data Flow

1. **Ingestion:** EU references extracted from Norwegian statute text via `src/parsers/eu-reference-parser.ts`
2. **Storage:** Stored in `eu_documents` and `eu_references` tables
3. **Lookup:** Bi-directional queries via MCP tools
4. **Validation:** CELEX numbers validated against EUR-Lex format

### Example Queries

**Norwegian -> EU:**
```sql
-- Find EU basis for personopplysningsloven
SELECT ed.id, ed.short_name, er.reference_type
FROM eu_references er
JOIN eu_documents ed ON er.eu_document_id = ed.id
WHERE er.document_id = 'LOV-2018-06-15-38';
```

**EU -> Norwegian:**
```sql
-- Find Norwegian implementations of GDPR
SELECT ld.id, ld.title, er.is_primary_implementation
FROM eu_references er
JOIN legal_documents ld ON er.document_id = ld.id
WHERE er.eu_document_id = 'regulation:2016/679';
```

**Provision-level:**
```sql
-- EU basis for personopplysningsloven kapittel 3 § 5
SELECT ed.id, ed.short_name, er.eu_article
FROM eu_references er
JOIN eu_documents ed ON er.eu_document_id = ed.id
JOIN legal_provisions lp ON er.provision_id = lp.id
WHERE lp.document_id = 'LOV-2018-06-15-38' AND lp.provision_ref = '3:5';
```

**EU Ingestion Commands:**
```bash
# Fetch missing EU documents from EUR-Lex
npm run fetch:eurlex -- --missing

# Fetch single EU document
npm run fetch:eurlex -- regulation:2016/679

# Import EUR-Lex documents into database
npm run import:eurlex-documents

# Migrate EU references from seed files
npm run migrate:eu-references

# Verify EU coverage
npm run verify:eu-coverage
```

## Testing

Tests use in-memory SQLite with sample Norwegian law data:

```typescript
import { createTestDatabase, closeTestDatabase } from '../fixtures/test-db.js';

describe('search_legislation', () => {
  let db: Database;
  beforeAll(() => { db = createTestDatabase(); });
  afterAll(() => { closeTestDatabase(db); });

  it('should find personvern provisions', async () => {
    const result = await searchLegislation(db, { query: 'personopplysninger' });
    expect(result.length).toBeGreaterThan(0);
  });
});
```

Sample data includes: personopplysningsloven (LOV-2018-06-15-38), old personopplysningsloven (LOV-2000-04-14-31), court decisions, preparatory works, definitions, and cross-references.

## Database Statistics

- **Statutes:** 3,400 laws (lover)
- **Provisions:** 33,521 sections
- **Database Size:** 87 MB
- **MCP Tools:** 15

## Ingestion from Lovdata

Ingestion script: `scripts/ingest-lovdata.ts`
License gate: `scripts/lib/legal-data-license.ts`

Norwegian legislation is public. Lovdata consolidation is a public service; reuse permitted with attribution.

**Note:** Some Lovdata APIs require authentication. Public statute text is freely available.

## Resources

- [Lovdata](https://lovdata.no/) - Official Norwegian legal portal
- [Norsk Lovtidend](https://lovdata.no/register/lovtidend) - Norwegian Code of Statutes
- [Rettsinfo](https://rettsinfo.no/) - Legal information system
- [EUR-Lex](https://eur-lex.europa.eu/) - EU legislation database

## Git Workflow

- **Never commit directly to `main`.** Always create a feature branch and open a Pull Request.
- Branch protection requires: verified signatures, PR review, and status checks to pass.
- Use conventional commit prefixes: `feat:`, `fix:`, `chore:`, `docs:`, etc.
