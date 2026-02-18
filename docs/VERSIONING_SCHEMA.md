# Historical Versioning Schema Design

## Norwegian Statute Amendment Patterns

### Amendment Keywords (Observed in Corpus)

Norwegian statutes use these standard phrases to indicate amendments:

1. **Endret ved lov DD. MMM YYYY nr. NNN** - "Amended by Law LOV-YYYY-MM-DD-NNN"
   - Appears at end of provision text
   - Example: `Endret ved lov 18 juni 2021 nr 89.` means this provision was last amended by LOV-2021-06-18-89

2. **Opphevet ved lov DD. MMM YYYY nr. NNN** - "Repealed by Law LOV-YYYY-MM-DD-NNN"
   - Indicates provision or entire statute was repealed

3. **Ny lydelse** - "New wording"
   - Used in amending statutes to show replacement text

4. **Tilfoyd ved lov** - "Introduced by law"
   - Shows when provision was added to existing statute

5. **Er opphevet ved lov** - "Has been repealed by law"
   - Used in transition provisions

### Consolidation Practice

**Lovdata consolidates statute text** - the database returns the **current consolidated version** with amendment citations appended to each provision. Historical text must be reconstructed from:

1. **Original statute text** (LOV-YYYY-MM-DD-NNN)
2. **Amending statute text** (LOV-YYYY-MM-DD-MMM) - contains "endringer" sections listing specific provision changes

Example from personopplysningsloven (LOV-2018-06-15-38):
- Original: LOV-2018-06-15-38 (issued 2018-06-15, in force 2018-07-20)
- Amended by: LOV-2018-12-20-116, LOV-2021-06-18-89, LOV-2022-06-17-52
- Current text shows: `1:3 ... Endret ved lov 18 juni 2021 nr 89.` indicating last amendment

### Amendment Metadata Sources

1. **Provision text suffix**: `Endret ved lov ...` at end
2. **Lovdata document metadata**: Contains fields like "Opphevet", amendment references
3. **Cross-references table**: Already captures "amended_by" relationships
4. **Amending statute documents**: Contain sections like "Endringer i personopplysningsloven (LOV-2018-06-15-38)"

## Current Schema Status

### Existing Tables (Already Implemented)

```sql
-- Current provision snapshot (consolidated text)
CREATE TABLE legal_provisions (
  id INTEGER PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES legal_documents(id),
  provision_ref TEXT NOT NULL,
  chapter TEXT,
  section TEXT NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  metadata TEXT,
  UNIQUE(document_id, provision_ref)
);

-- Historical versions (16,980 records for 81 statutes already ingested!)
CREATE TABLE legal_provision_versions (
  id INTEGER PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES legal_documents(id),
  provision_ref TEXT NOT NULL,
  chapter TEXT,
  section TEXT NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  metadata TEXT,
  valid_from TEXT,  -- ISO date when this version became effective
  valid_to TEXT     -- ISO date when superseded (NULL = current)
);

CREATE INDEX idx_provision_versions_doc_ref
  ON legal_provision_versions(document_id, provision_ref);
CREATE INDEX idx_provision_versions_window
  ON legal_provision_versions(valid_from, valid_to);
```

**Observation**: The schema already supports versioning! The `legal_provision_versions` table has 16,980 version records. However:
- Most records have `valid_from` but `valid_to = NULL`
- No explicit amendment tracking (which LOV amended which provision)
- No diff/changelog metadata

## Enhanced Schema: Amendment Tracking Table

To enable **amendment chain queries** and **change attribution**, add:

```sql
-- Amendment tracking: explicit record of each statutory change
CREATE TABLE statute_amendments (
  id INTEGER PRIMARY KEY,

  -- Target statute being amended
  target_document_id TEXT NOT NULL REFERENCES legal_documents(id),
  target_provision_ref TEXT,  -- NULL = entire statute affected

  -- Amending statute
  amended_by_lov TEXT NOT NULL,  -- LOV number, e.g., "LOV-2021-06-18-89"
  amendment_date TEXT NOT NULL,   -- ISO date: when amendment took effect

  -- Type of amendment
  amendment_type TEXT NOT NULL
    CHECK(amendment_type IN ('endret', 'ny_lydelse', 'tilfoyd', 'opphevet', 'ikrafttredelse')),

  -- Version linkage
  version_before_id INTEGER REFERENCES legal_provision_versions(id),
  version_after_id INTEGER REFERENCES legal_provision_versions(id),

  -- Change metadata
  change_summary TEXT,  -- Brief description: "Changed reference from popplyl-2000 to popplyl"
  amendment_section TEXT,  -- Section in amending statute, e.g., "§ 3" in LOV-2021-06-18-89

  UNIQUE(target_document_id, target_provision_ref, amended_by_lov, amendment_date)
);

CREATE INDEX idx_amendments_target
  ON statute_amendments(target_document_id, target_provision_ref);
CREATE INDEX idx_amendments_date
  ON statute_amendments(amendment_date);
CREATE INDEX idx_amendments_amending_lov
  ON statute_amendments(amended_by_lov);

-- FTS5 index for searching amendment summaries
CREATE VIRTUAL TABLE amendments_fts USING fts5(
  change_summary, amendment_section,
  content='statute_amendments',
  content_rowid='id'
);
```

### Amendment Type Taxonomy

| Type | Norwegian | Description | Example |
|------|---------|-------------|---------|
| `endret` | Endret | Provision text modified | popplyl 1:3 modified by LOV-2021-06-18-89 |
| `ny_lydelse` | Ny lydelse | Complete replacement | Provision rewritten entirely |
| `tilfoyd` | Tilfoyd ved | New provision added | New section inserted mid-statute |
| `opphevet` | Opphevet | Provision repealed | Deleted provision |
| `ikrafttredelse` | Ikrafttredelse | Delayed effectiveness | Transitional rules |

## Storage Strategy: Full Copy vs Diffs

### Option A: Full Copy (RECOMMENDED)
**Store complete provision text for each version**

Pros:
- Simple queries: `SELECT content WHERE valid_from <= date`
- No reconstruction needed
- Text search works directly on historical versions
- Already implemented in `legal_provision_versions`

Cons:
- Higher storage (but SQLite compression mitigates)
- Current: 16,980 versions x ~500 bytes avg = ~8.5 MB (negligible)

### Option B: Delta Storage
**Store diffs between versions**

Pros:
- Lower storage for large, frequently-amended statutes

Cons:
- Complex reconstruction logic
- Breaks full-text search on history
- Must traverse amendment chain for queries
- Not worth complexity for Norwegian law corpus size

**Decision**: Continue with **full copy** approach. Norwegian legal corpus is small enough (~100-500 statutes x ~10 versions avg = ~50,000 records = ~25 MB total).

## Time-Travel Query Design

### Query 1: Get provision text as of specific date

```sql
-- Get popplyl 3:5 as it read on 2020-01-01
SELECT content, valid_from, valid_to
FROM legal_provision_versions
WHERE document_id = 'LOV-2018-06-15-38'
  AND provision_ref = '3:5'
  AND (valid_from IS NULL OR valid_from <= '2020-01-01')
  AND (valid_to IS NULL OR valid_to > '2020-01-01')
ORDER BY valid_from DESC
LIMIT 1;
```

### Query 2: Show amendment chain

```sql
-- Show all amendments to popplyl 1:3
SELECT
  sa.amendment_date,
  sa.amended_by_lov,
  sa.amendment_type,
  sa.change_summary,
  vprev.content as content_before,
  vnext.content as content_after
FROM statute_amendments sa
LEFT JOIN legal_provision_versions vprev ON sa.version_before_id = vprev.id
LEFT JOIN legal_provision_versions vnext ON sa.version_after_id = vnext.id
WHERE sa.target_document_id = 'LOV-2018-06-15-38'
  AND sa.target_provision_ref = '1:3'
ORDER BY sa.amendment_date;
```

### Query 3: Find all statutes amended in given year

```sql
SELECT
  ld.title,
  ld.short_name,
  COUNT(*) as amendment_count,
  GROUP_CONCAT(DISTINCT sa.amended_by_lov) as amended_by
FROM statute_amendments sa
JOIN legal_documents ld ON sa.target_document_id = ld.id
WHERE sa.amendment_date LIKE '2021%'
GROUP BY sa.target_document_id
ORDER BY amendment_count DESC;
```

### Query 4: Diff between two dates

```sql
-- Show what changed in popplyl between 2020-01-01 and 2023-01-01
SELECT
  v1.provision_ref,
  v1.content as content_2020,
  v2.content as content_2023,
  sa.amendment_date,
  sa.amended_by_lov,
  sa.change_summary
FROM legal_provision_versions v1
JOIN legal_provision_versions v2
  ON v1.document_id = v2.document_id
  AND v1.provision_ref = v2.provision_ref
LEFT JOIN statute_amendments sa
  ON sa.target_document_id = v1.document_id
  AND sa.target_provision_ref = v1.provision_ref
  AND sa.amendment_date BETWEEN '2020-01-01' AND '2023-01-01'
WHERE v1.document_id = 'LOV-2018-06-15-38'
  AND v1.valid_from <= '2020-01-01'
  AND (v1.valid_to IS NULL OR v1.valid_to > '2020-01-01')
  AND v2.valid_from <= '2023-01-01'
  AND (v2.valid_to IS NULL OR v2.valid_to > '2023-01-01')
  AND v1.content != v2.content;
```

## Implementation Strategy

### Phase 1: Enhance Existing Data (No Schema Changes Needed)
1. Populate `valid_to` dates in existing `legal_provision_versions` records
2. Parse amendment references from provision text: `Endret ved lov ...`
3. Create cross-references with `ref_type='amended_by'`

### Phase 2: Add Amendment Tracking Table
1. Run migration to add `statute_amendments` table
2. Backfill from existing data:
   - Extract amendment citations
   - Match to version records
   - Create amendment records

### Phase 3: Ingestion Pipeline Updates
1. When ingesting amending statute:
   - Parse "Endringer i lov (LOV-YYYY-MM-DD-NNN)" sections
   - Extract provision changes
   - Create new version records
   - Link with amendment records
2. Update `valid_to` dates of superseded versions

### Phase 4: MCP Tools
1. `get_provision_at_date(law_id, provision, date)` - time-travel query
2. `get_amendment_history(law_id, provision)` - show change log
3. `diff_provisions(law_id, provision, date1, date2)` - compare versions
4. Update `search_legislation` to support date filters

## Data Quality Considerations

### Challenges

1. **Lovdata consolidation**: API returns only current text
   - Need to parse amending statutes to extract old text
   - Some amendments may be in older LOV not digitized

2. **Retroactive changes**: Some amendments apply retroactively
   - Must capture both "amendment date" and "effective date"

3. **Transitional rules**: Gradual phase-ins
   - Example: "Takes effect 2023-01-01 for new cases, 2024-01-01 for existing"
   - May need multiple version records per provision

4. **Missing historical text**: Pre-digital era statutes
   - Lovdata coverage: ~1990s onward for full text
   - Earlier statutes may only have consolidated current text

### Data Verification

For each amendment record:
- `amended_by_lov` must exist as `legal_document` with `type='statute'`
- `amendment_date` must be >= `target_document.issued_date`
- `version_before_id` must have `valid_to = amendment_date`
- `version_after_id` must have `valid_from = amendment_date`
- Text diff should be non-empty (unless pure metadata change)

## Alternative Data Sources

If Lovdata lacks historical text:

1. **Lovdata.no**: Official legal database
   - May have archived versions
   - Limited free API access

2. **Rettsinfo**: Government legal database
   - Focus on current law
   - Limited statute versioning

3. **Norsk Lovtidend print archive**: National Library
   - Physical/PDF copies of original LOV publications
   - Would require OCR for digitization

4. **Reconstructive approach**: Work backwards from amendments
   - Parse amending statute text: "§ 5 skal lyde"
   - Extract replacement text from amending document
   - Requires sophisticated NLP for Norwegian legal language
