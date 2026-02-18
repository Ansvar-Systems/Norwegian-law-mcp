# Changelog

All notable changes to the Norwegian Law MCP Server will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.1] - 2026-02-17 - Production Hardening

### Fixed
- Golden test connection order and WAL cleanup
- Test reliability improvements

### Changed
- Upgraded to MCP Infrastructure Blueprint compliance (Phase 2)

---

## [1.0.0] - 2026-02-14 - Initial Release

### Added

#### Data
- **3,441 Norwegian statutes** (lover) from Lovdata
- **EU cross-references** linking Norwegian statutes to EU directives and regulations
- **FTS5 full-text search** on provision text with BM25 ranking

#### MCP Tools (14)
1. `search_legislation` — Full-text statute search
2. `get_provision` — Retrieve specific provision
3. `search_case_law` — Case law search
4. `get_preparatory_works` — Legislative history lookup
5. `validate_citation` — Citation verification (zero-hallucination)
6. `build_legal_stance` — Multi-source aggregation
7. `format_citation` — Norwegian legal formatting
8. `check_currency` — Law validity check
9. `get_eu_basis` — EU directives/regulations for Norwegian statute
10. `get_norwegian_implementations` — Norwegian laws implementing EU act
11. `search_eu_implementations` — Search EU documents with implementation info
12. `get_provision_eu_basis` — EU basis at provision level
13. `validate_eu_compliance` — EU compliance status check
14. `about` — Server metadata and dataset statistics

#### Infrastructure
- Dual-channel transport: stdio (npm) + Streamable HTTP (Vercel)
- 12 golden contract tests with drift detection
- 6-layer security scanning (CodeQL, Semgrep, Trivy, Gitleaks, Socket, OSSF)
- MCP Registry publishing with OIDC attestation
- Daily drift detection workflow

#### Data Sources
- **Lovdata** (lovdata.no) — Official Norwegian legal portal
- **EUR-Lex** — EU directive/regulation metadata

---

## Attribution

### Data Sources

#### Statutes
- **Source:** Lovdata (Stiftelsen Lovdata)
- **License:** Norwegian legislation is public; reuse permitted with attribution
- **Coverage:** 3,441 statutes from historical to current

#### EU Cross-References
- **Source:** Norwegian statute text + EUR-Lex metadata
- **Extraction:** Automated parser with manual validation
- **Validation:** CELEX number format verification

---

**Maintained by:** [Ansvar Systems AB](https://ansvar.eu)
**Repository:** https://github.com/Ansvar-Systems/norwegian-law-mcp
**Support:** contact@ansvar.ai
