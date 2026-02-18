-- Personopplysningsloven (LOV-2018-06-15-38) Version Tracking Prototype
--
-- Demonstrates how amendment tracking works for a statute with known amendment history.
-- personopplysningsloven has been amended 6 times since enactment in 2018.

-- ============================================================================
-- MIGRATION: Add statute_amendments table
-- ============================================================================

CREATE TABLE statute_amendments (
  id INTEGER PRIMARY KEY,

  -- Target statute being amended
  target_document_id TEXT NOT NULL REFERENCES legal_documents(id),
  target_provision_ref TEXT,  -- NULL = entire statute affected

  -- Amending statute
  amended_by_lov TEXT NOT NULL,
  amendment_date TEXT NOT NULL,

  -- Type of amendment
  amendment_type TEXT NOT NULL
    CHECK(amendment_type IN ('endret', 'ny_ordlyd', 'tilføyd', 'opphevet', 'ikrafttredelse')),

  -- Version linkage
  version_before_id INTEGER REFERENCES legal_provision_versions(id),
  version_after_id INTEGER REFERENCES legal_provision_versions(id),

  -- Change metadata
  change_summary TEXT,
  amendment_section TEXT,

  UNIQUE(target_document_id, target_provision_ref, amended_by_lov, amendment_date)
);

CREATE INDEX idx_amendments_target
  ON statute_amendments(target_document_id, target_provision_ref);
CREATE INDEX idx_amendments_date
  ON statute_amendments(amendment_date);
CREATE INDEX idx_amendments_amending_lov
  ON statute_amendments(amended_by_lov);

-- ============================================================================
-- SAMPLE DATA: personopplysningsloven Amendment History
-- ============================================================================

-- Personopplysningsloven (LOV-2018-06-15-38) Timeline:
-- 2018-07-20: Original enactment
-- 2018-12-01: Amended by LOV-2018-12-20-112 (sikkerhetsprovisjoner)
-- 2019-04-01: Amended by LOV-2018-12-20-116 (forskningsprovisjoner)
-- 2021-12-01: Amended by LOV-2021-12-03-127 (Forsvar/sikkerhetsunntak)
-- 2022-07-01: Amended by LOV-2022-06-17-58 (rapportering av databrudd)
-- 2025-01-15: Amended by LOV-2025-01-10-4 (tilgang for rettshåndhevelse)
-- 2025-02-01: Amended by LOV-2025-01-24-9 (klagebehandlingsprosedyrer)

-- Amendment 1: LOV-2018-12-20-112 (Sikkerhetsprovisjoner - 1 kap. 4 §)
INSERT INTO statute_amendments (
  target_document_id, target_provision_ref,
  amended_by_lov, amendment_date,
  amendment_type, change_summary, amendment_section
) VALUES (
  'LOV-2018-06-15-38', '1:4',
  'LOV-2018-12-20-112', '2018-12-01',
  'endret', 'Utvidet unntak for rapportering av databrudd under sikkerhetslovgivningen', '1 §'
);

-- Amendment 2: LOV-2018-12-20-116 (Forskningsprovisjoner - 4 kap. 3 §)
INSERT INTO statute_amendments (
  target_document_id, target_provision_ref,
  amended_by_lov, amendment_date,
  amendment_type, change_summary, amendment_section
) VALUES (
  'LOV-2018-06-15-38', '4:3',
  'LOV-2018-12-20-116', '2019-04-01',
  'ny_ordlyd', 'Ny ordlyd for vitale interesser-unntak ved behandling av forskningsdata', '1 §'
);

-- Amendment 3: LOV-2021-12-03-127 (Forsvar/sikkerhetsunntak - 1 kap. 3 §)
INSERT INTO statute_amendments (
  target_document_id, target_provision_ref,
  amended_by_lov, amendment_date,
  amendment_type, change_summary, amendment_section
) VALUES (
  'LOV-2018-06-15-38', '1:3',
  'LOV-2021-12-03-127', '2021-12-01',
  'endret', 'Lagt til unntak for Forsvaret (127) og Etterretningstjenesten (128) ved behandling av personopplysninger', '1 §'
);

-- Amendment 4: LOV-2022-06-17-58 (Rapportering av databrudd - 1 kap. 4 §)
INSERT INTO statute_amendments (
  target_document_id, target_provision_ref,
  amended_by_lov, amendment_date,
  amendment_type, change_summary, amendment_section
) VALUES (
  'LOV-2018-06-15-38', '1:4',
  'LOV-2022-06-17-58', '2022-07-01',
  'endret', 'Presisert unntak for bruddrapportering etter sikkerhetsloven', '1 §'
);

-- Amendment 5: LOV-2025-01-10-4 (Tilgang for rettshåndhevelse - 2 kap. 5 §)
INSERT INTO statute_amendments (
  target_document_id, target_provision_ref,
  amended_by_lov, amendment_date,
  amendment_type, change_summary, amendment_section
) VALUES (
  'LOV-2018-06-15-38', '2:5',
  'LOV-2025-01-10-4', '2025-01-15',
  'endret', 'Utvidet liste over etater som kan be om utlevering av opplysninger (Tolletaten lagt til)', '1 §'
);

-- Amendment 6: LOV-2025-01-24-9 (Klagebehandling - 6 kap. 8 §, 7 kap. 3a §, 7 kap. 6 §)
INSERT INTO statute_amendments (
  target_document_id, target_provision_ref,
  amended_by_lov, amendment_date,
  amendment_type, change_summary, amendment_section
) VALUES
  (
    'LOV-2018-06-15-38', '6:8',
    'LOV-2025-01-24-9', '2025-02-01',
    'ny_ordlyd', 'Ny ordlyd for tidsfrist for klagesvar fra Datatilsynet', '1 §'
  ),
  (
    'LOV-2018-06-15-38', '7:3 a',
    'LOV-2025-01-24-9', '2025-02-01',
    'tilføyd', 'Ny bestemmelse: klagerett ved forsinket klagebehandling hos Datatilsynet', '2 §'
  ),
  (
    'LOV-2018-06-15-38', '7:6',
    'LOV-2025-01-24-9', '2025-02-01',
    'tilføyd', 'Ny bestemmelse: domstolsordre for å fremskynde klagebehandling hos Datatilsynet', '3 §'
  );

-- ============================================================================
-- TIME-TRAVEL QUERIES: personopplysningsloven 1:3 Version History
-- ============================================================================

-- Query 1: What did popplyl 1:3 say on 2020-01-01? (Before LOV-2021-12-03-127 amendment)
SELECT
  provision_ref,
  content,
  valid_from,
  valid_to
FROM legal_provision_versions
WHERE document_id = 'LOV-2018-06-15-38'
  AND provision_ref = '1:3'
  AND (valid_from IS NULL OR valid_from <= '2020-01-01')
  AND (valid_to IS NULL OR valid_to > '2020-01-01')
ORDER BY valid_from DESC
LIMIT 1;

-- Expected result (original 2018 text):
-- "Bestemmelsene i § 2 gjelder ikke for virksomhet som omfattes av lov (LOV-2019-12-06-119)
--  om PSTs behandling av personopplysninger."

-- Query 2: What did popplyl 1:3 say on 2023-01-01? (After LOV-2021-12-03-127 amendment)
SELECT
  provision_ref,
  content,
  valid_from,
  valid_to
FROM legal_provision_versions
WHERE document_id = 'LOV-2018-06-15-38'
  AND provision_ref = '1:3'
  AND (valid_from IS NULL OR valid_from <= '2023-01-01')
  AND (valid_to IS NULL OR valid_to > '2023-01-01')
ORDER BY valid_from DESC
LIMIT 1;

-- Expected result (amended text):
-- "Bestemmelsene i § 2 gjelder ikke for virksomhet som omfattes av
--  1. lov (LOV-2021-12-03-127) om behandling av personopplysninger i Forsvaret,
--  2. lov (LOV-2021-12-03-128) om behandling av personopplysninger i Etterretningstjenesten, eller
--  3. lov (LOV-2019-12-06-119) om PSTs behandling av personopplysninger. Lov (LOV-2021-12-03-127)."

-- ============================================================================
-- AMENDMENT CHAIN QUERY: Show all changes to personopplysningsloven
-- ============================================================================

SELECT
  sa.target_provision_ref as provision,
  sa.amendment_date,
  sa.amended_by_lov,
  sa.amendment_type,
  sa.change_summary,
  ld.title as amending_statute_title
FROM statute_amendments sa
LEFT JOIN legal_documents ld ON ld.id = sa.amended_by_lov
WHERE sa.target_document_id = 'LOV-2018-06-15-38'
ORDER BY sa.amendment_date, sa.target_provision_ref;

-- Expected output (6 rows):
-- provision | amendment_date | amended_by_lov          | amendment_type | change_summary
-- 1:4       | 2018-12-01     | LOV-2018-12-20-112      | endret         | Utvidet unntak...
-- 4:3       | 2019-04-01     | LOV-2018-12-20-116      | ny_ordlyd      | Ny ordlyd for forskning...
-- 1:3       | 2021-12-01     | LOV-2021-12-03-127      | endret         | Lagt til unntak for Forsvaret...
-- 1:4       | 2022-07-01     | LOV-2022-06-17-58       | endret         | Presisert unntak for bruddrapportering...
-- 2:5       | 2025-01-15     | LOV-2025-01-10-4        | endret         | Utvidet liste over etater...
-- 6:8       | 2025-02-01     | LOV-2025-01-24-9        | ny_ordlyd      | Ny ordlyd for klagesvar...
-- 7:3 a     | 2025-02-01     | LOV-2025-01-24-9        | tilføyd        | Ny bestemmelse: klagerett...
-- 7:6       | 2025-02-01     | LOV-2025-01-24-9        | tilføyd        | Ny bestemmelse: domstolsordre...

-- ============================================================================
-- DIFF QUERY: What changed in personopplysningsloven between 2020 and 2023?
-- ============================================================================

WITH v2020 AS (
  SELECT provision_ref, content
  FROM legal_provision_versions
  WHERE document_id = 'LOV-2018-06-15-38'
    AND (valid_from IS NULL OR valid_from <= '2020-01-01')
    AND (valid_to IS NULL OR valid_to > '2020-01-01')
),
v2023 AS (
  SELECT provision_ref, content
  FROM legal_provision_versions
  WHERE document_id = 'LOV-2018-06-15-38'
    AND (valid_from IS NULL OR valid_from <= '2023-01-01')
    AND (valid_to IS NULL OR valid_to > '2023-01-01')
)
SELECT
  v2020.provision_ref,
  v2020.content as content_2020,
  v2023.content as content_2023,
  sa.amendment_date,
  sa.amended_by_lov,
  sa.change_summary
FROM v2020
JOIN v2023 ON v2020.provision_ref = v2023.provision_ref
LEFT JOIN statute_amendments sa
  ON sa.target_document_id = 'LOV-2018-06-15-38'
  AND sa.target_provision_ref = v2020.provision_ref
  AND sa.amendment_date BETWEEN '2020-01-01' AND '2023-01-01'
WHERE v2020.content != v2023.content
ORDER BY v2020.provision_ref;

-- Expected output: provisions 1:3, 1:4 (amended by LOV-2021-12-03-127 and LOV-2022-06-17-58)

-- ============================================================================
-- STATUTE-LEVEL QUERY: All statutes amended in 2021
-- ============================================================================

SELECT
  ld.id,
  ld.title,
  ld.short_name,
  COUNT(*) as amendment_count,
  GROUP_CONCAT(DISTINCT sa.amended_by_lov) as amended_by
FROM statute_amendments sa
JOIN legal_documents ld ON sa.target_document_id = ld.id
WHERE sa.amendment_date LIKE '2021%'
GROUP BY sa.target_document_id
ORDER BY amendment_count DESC;

-- Expected output includes:
-- LOV-2018-06-15-38 | Lov om behandling av personopplysninger (personopplysningsloven) | popplyl | 1 | LOV-2021-12-03-127

-- ============================================================================
-- MCP TOOL IMPLEMENTATION EXAMPLE
-- ============================================================================

/*
Tool: get_provision_at_date

Parameters:
- law_id: string (e.g., "LOV-2018-06-15-38")
- provision_ref: string (e.g., "1:3")
- date: ISO date string (e.g., "2020-06-15")

Returns:
{
  "provision_ref": "1:3",
  "chapter": "1",
  "section": "3",
  "content": "Bestemmelsene i § 2 gjelder ikke...",
  "valid_from": "2018-07-20",
  "valid_to": "2021-12-01",
  "status": "historical",  // "historical" | "current"
  "amended_by": [
    {
      "amended_by_lov": "LOV-2021-12-03-127",
      "date": "2021-12-01",
      "type": "endret",
      "summary": "Lagt til unntak for Forsvaret..."
    }
  ]
}

SQL Query:
*/

-- Implementation query template:
WITH target_version AS (
  SELECT
    id,
    provision_ref,
    chapter,
    section,
    title,
    content,
    valid_from,
    valid_to
  FROM legal_provision_versions
  WHERE document_id = ? -- bind: law_id
    AND provision_ref = ? -- bind: provision_ref
    AND (valid_from IS NULL OR valid_from <= ?) -- bind: date
    AND (valid_to IS NULL OR valid_to > ?) -- bind: date
  ORDER BY valid_from DESC
  LIMIT 1
)
SELECT
  tv.*,
  CASE
    WHEN tv.valid_to IS NULL THEN 'current'
    ELSE 'historical'
  END as status,
  json_group_array(
    json_object(
      'amended_by_lov', sa.amended_by_lov,
      'date', sa.amendment_date,
      'type', sa.amendment_type,
      'summary', sa.change_summary
    )
  ) as amendments_json
FROM target_version tv
LEFT JOIN statute_amendments sa
  ON sa.target_document_id = ? -- bind: law_id
  AND sa.target_provision_ref = tv.provision_ref
  AND sa.amendment_date > tv.valid_from
GROUP BY tv.id;

-- ============================================================================
-- VALIDATION QUERIES
-- ============================================================================

-- Check 1: Every amendment references a real statute
SELECT sa.amended_by_lov
FROM statute_amendments sa
LEFT JOIN legal_documents ld ON ld.id = sa.amended_by_lov
WHERE ld.id IS NULL;
-- Should return 0 rows

-- Check 2: Amendment dates are after target statute enactment
SELECT
  sa.target_document_id,
  sa.amended_by_lov,
  sa.amendment_date,
  ld.issued_date as target_issued
FROM statute_amendments sa
JOIN legal_documents ld ON ld.id = sa.target_document_id
WHERE sa.amendment_date < ld.issued_date;
-- Should return 0 rows

-- Check 3: Amendments have corresponding version records
SELECT
  sa.target_document_id,
  sa.target_provision_ref,
  sa.amendment_date,
  COUNT(v.id) as version_count
FROM statute_amendments sa
LEFT JOIN legal_provision_versions v
  ON v.document_id = sa.target_document_id
  AND v.provision_ref = sa.target_provision_ref
  AND v.valid_from = sa.amendment_date
GROUP BY sa.id
HAVING version_count = 0;
-- Should return 0 rows (unless amendment affects entire statute)
