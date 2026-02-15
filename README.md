# Norwegian Law MCP Server

Production-grade MCP server for Norwegian legal research with Swedish-Law-MCP parity architecture and licensing-aware ingestion controls.

## What this server provides
- Search and retrieval tools for legal documents/provisions
- EU cross-reference tooling (same architecture as Swedish Law MCP)
- Deterministic SQLite build pipeline
- Capability detection via DB schema
- Daily data freshness monitor with optional auto-PR
- Security and publishing workflows (CodeQL, Semgrep, Trivy, Gitleaks, Socket, Scorecard, provenance publish)

## Hard architecture parity (implemented)
- `build:db` is **destructive** and rebuilds from seed files
- `build:db:paid` is **additive** and upgrades schema/tier metadata
- `db_metadata` table is written and read for runtime capability detection
- Database artifacts are gitignored (`data/*.db`, `*.db-wal`, `*.db-shm`)
- `server.json` present and aligned with `package.json` `mcpName`

## Country-specific ingestion and legal-risk control
Official-source direction for Norway is configured with a licensing gate.

- Ingestion script: `scripts/ingest-lovdata.ts`
- License gate module: `scripts/lib/legal-data-license.ts`
- Policy seed: `data/seed/_legal_data_license.json`
- Policy doc: `LEGAL_DATA_LICENSE.md`

Default policy mode is full-text for covered statutes/regulations and metadata-only for restricted sources (for example case-law channels without explicit rights).

## Install
```bash
npm ci
npm run build:db
npm run build
npm test
```

## Run
```bash
npm start
```

## Key scripts
- `npm run build:db` - destructive free-tier DB rebuild from seeds
- `npm run build:db:paid` - additive professional-tier schema upgrade
- `npm run ingest -- <LOV-ID> <output-file>` - license-gated Norwegian ingestion
- `npm run ingest:all` - ingest full official NL+NLO statute catalog from `data/relevant-statutes-all.json`
- `npm run ingest:auto-all` - default full-catalog ingestion entrypoint (same dataset as `ingest:all`)
- `npm run check-updates` - official-source freshness check

## Validation commands
```bash
npm ci
npm run build:db
npm run build
npm test
npm run check-updates
gitleaks detect --source . --report-format sarif --report-path gitleaks.sarif --no-git
```

## Security workflows
- `.github/workflows/codeql.yml`
- `.github/workflows/semgrep.yml`
- `.github/workflows/trivy.yml`
- `.github/workflows/gitleaks.yml`
- `.github/workflows/socket-security.yml`
- `.github/workflows/ossf-scorecard.yml`

## Publishing
- npm package publish workflow uses provenance attestation
- `server.json` included for MCP registry compatibility
- `package.json` includes `mcpName: eu.ansvar/norwegian-law-mcp`

## Disclaimer
This project is a legal research tool and not legal advice. Always verify authoritative legal text at official publication links.
