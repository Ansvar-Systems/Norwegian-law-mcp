# LEGAL_DATA_LICENSE.md

## Purpose
This repository enforces a licensing-compliance gate for ingestion of Norwegian legal data.

Decision date: **2026-02-15**

## Explicit licensing decision
Current policy is source-scoped and content-scoped:

- **Statutes/regulations** from Lovdata/Lovtidend that fall under Lovdata user agreement section 2.3 (NLOD 2.0 exception) are treated as **full-text ingest allowed** with attribution.
- **Case-law full text** remains **restricted** (metadata + deep links only) unless explicit permission is documented.

## Evidence used
- Lovdata user agreement (`/info/brukeravtale`) section 2.3 states that specific legal content (including current formal laws, current central regulations, and rule texts in Norsk Lovtidend) can be copied/used/shared under **NLOD 2.0** with source attribution.
- Lovdata API site (`https://api.lovdata.no/`) states API data can be used to make current regulations available in services and used for AI experimentation/research.

## Allowed (current)
- Full-text ingestion/caching/redistribution of covered statute/regulation texts with required attribution.
- Metadata caching and stable deep links for all configured sources.
- Use of official Lovdata/API channels for updates and rebuilds.

## Not allowed (current)
- Full-text redistribution/caching of Norwegian case-law content without explicit rights approval.
- Rights assumptions beyond the documented scope (e.g., non-covered datasets).
- Ignoring source attribution and NLOD conditions for covered content.

## Gate behavior
Licensing gate module: `/Users/jeffreyvonrotz/Projects/Norwegian-law-MCP/scripts/lib/legal-data-license.ts`

- `full_text` mode is allowed only when both `allow_full_text_cache` and `allow_full_text_redistribution` are true for the source.
- Otherwise ingestion is forced to `metadata_only` with deep links and policy notes.

## Source policy records
- Seed policy file: `/Users/jeffreyvonrotz/Projects/Norwegian-law-MCP/data/seed/_legal_data_license.json`
- Database table: `legal_source_policies` (written by `npm run build:db`)

## Sources covered
- `lovdata` (statute/regulation scope allowed, case-law scope restricted)
- `lovtidend` (covered legal acts allowed)
- `domstol` (metadata-only pending explicit rights)

## Operational assumptions
- Ingestion scripts only ingest covered statute/regulation content in full-text mode.
- Large/systematic extraction should prefer official APIs and respect rate limits/service constraints.
- This document is an engineering compliance record, not legal advice.
