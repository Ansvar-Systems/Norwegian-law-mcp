# LEGAL_DATA_LICENSE.md

## Status: WITHDRAWN — 2026-05-02

This MCP's Lovdata-scraped corpus has been removed as of 2026-05-02. Earlier
versions of this file claimed Lovdata vilkår §2.3 NLOD 2.0 covered HTML
scraping of `lovdata.no/dokument/`. That claim was materially false:

- **§2.1** of Lovdata's vilkår explicitly prohibits non-personal/commercial
  use, mass downloading, and AI training or development.
- **§2.3** (the NLOD 2.0 exception) covers content available via the official
  API at `api.lovdata.no` — not site scraping.

The README's earlier "public domain" framing was also incorrect.

## Phase 2 (deferred)

A rebuild via `api.lovdata.no` is planned but conditional on first-hand
verification that the API's terms explicitly permit commercial + AI use,
and that the API's free public surface offers provision-level granularity
matching the prior corpus. If verification fails, no Phase 2 ships under
this name; an alternative path (fetch-on-demand, narrower coverage, or
paid commercial license) would be designed separately.

## Scope of removal

- All `data/seed/lov-*.json` files (3,401 statutes, 71 MB) deleted from
  working tree and removed from git history via `git filter-repo`.
- GHCR `:latest` and all version tags deleted; layer GC requested.
- npm `@ansvar/norwegian-law-mcp` deprecated; tarball removal requested
  via npm legal-takedown ticket.
- This repo will be archived following the takedown PR merge and history
  rewrite.

## Acknowledged residuals

The takedown is best-effort. Pre-rewrite clones on third-party machines,
Wayback Machine snapshots predating the takedown, and any npm-mirror
copies cannot be unilaterally removed and have been documented as
residuals. Takedown requests have been submitted to Wayback and to npm
support; mirror operators are being notified case-by-case.
