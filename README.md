# Norwegian Law MCP Server

## WITHDRAWN — 2026-05-02

This MCP has been withdrawn under Lovdata vilkår §2.1 compliance. The
Lovdata-scraped corpus that earlier versions shipped has been removed
from this repo, GHCR, and npm. The repository is archived as the public
takedown record.

See [`LEGAL_DATA_LICENSE.md`](./LEGAL_DATA_LICENSE.md) for the basis and
[Phase 2 plan](https://github.com/Ansvar-Systems/Ansvar-Architecture-Documentation/blob/main/docs/superpowers/specs/2026-05-02-norwegian-law-mcp-takedown-design.md#8-out-of-scope-phase-2)
for the planned `api.lovdata.no`-based rebuild.

**For prior installers:** the npm package is deprecated. If you have a
local clone or pulled image predating 2026-05-02, please remove it.

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

---

## What was here

Earlier versions of this MCP offered Norwegian statute search backed by
content scraped from `lovdata.no/dokument/` (statutes and provisions,
plus preparatory works metadata). The active install instructions,
hosted endpoint URL, tool descriptions, query examples, roadmap, and
data-source tables that previously appeared in this README have all
been removed under the takedown.

**Why the removal:**

- Lovdata vilkår **§2.1** prohibits non-personal/commercial use, mass
  downloading, and AI training of content served on `lovdata.no`.
- The prior README's "public domain" framing of that corpus was
  materially incorrect, and the §2.3 NLOD 2.0 exception cited in the
  earlier `LEGAL_DATA_LICENSE.md` covers the `api.lovdata.no` API
  surface — not site scraping.

A Phase 2 rebuild via `api.lovdata.no` is planned but conditional on
first-hand verification that the API's terms permit commercial + AI
use; see the takedown spec linked above.

---

## License

Apache License 2.0 — see [`LICENSE`](./LICENSE).

The Apache 2.0 wrapper covers the code artifacts that survive in this
repository (TypeScript sources, schemas, tests). It does **not** cover
the Lovdata-derived data, which has been removed.

For data-licensing context, see [`LEGAL_DATA_LICENSE.md`](./LEGAL_DATA_LICENSE.md).

---

## About Ansvar Systems

[ansvar.eu](https://ansvar.eu) — Stockholm, Sweden
