# Data Sources and Authority (Norwegian Law MCP)

## Official-source policy
This server is configured for Norwegian official-source ingestion with licensing control.

Primary sources:
- Lovdata (official Norwegian legal portal and API)
- Official publication channels (e.g., Lovtidend)
- Official court publication channels (metadata/deep-link mode unless explicit rights are documented)

## Licensing gate
See `/Users/jeffreyvonrotz/Projects/Norwegian-law-MCP/LEGAL_DATA_LICENSE.md`.

Current default mode:
- Full-text ingestion for covered statute/regulation sources (per `LEGAL_DATA_LICENSE.md`)
- Metadata + stable deep links for restricted sources
- Source attribution requirements enforced through policy metadata

## Data pipeline
1. Ingest official-source statutes via `npm run ingest -- <LOV-ID> data/seed/<file>.json`
2. Build DB via `npm run build:db`
3. Use MCP tools for search/retrieval against local full-text index (covered sources)
4. Follow source URL for authoritative verification and for restricted-source fetch-on-demand

## Update monitoring
Daily freshness checks run via `.github/workflows/check-updates.yml` and `npm run check-updates`.

The monitor checks configured statute entries against official source pages and can open an automated update PR when `auto_update: true` is used in workflow dispatch.

## Professional-use warning
This is a legal research aid, not legal advice. Always verify with official publications before professional reliance.
