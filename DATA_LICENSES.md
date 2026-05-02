# Data Licenses

## Sources

### api.lovdata.no — current Norwegian statutes and central regulations

- **License:** NLOD 2.0 — Norwegian Licence for Open Government Data
- **License URL:** https://data.norge.no/nlod/en/2.0/
- **Basis:** Lovdata vilkår §2.3 (carve-out from §2.1's restrictions for current laws and central regulations published via api.lovdata.no)
- **Attribution required:** "Contains data under the Norwegian licence for Open Government data (NLOD) distributed by Lovdata"
- **Commercial use:** permitted
- **AI training/development:** permitted under §2.3 carve-out (Lovdata article 5277, 2025-11-03)
- **Mass downloading:** permitted via the API. The §2.1 mass-downloading prohibition applies to lovdata.no/dokument/ HTML scraping, NOT the api.lovdata.no datasets.

## Code License

The MCP server software (TypeScript code, Dockerfile, ingestion scripts) is licensed under Apache-2.0. See [LICENSE](LICENSE).

The Apache-2.0 code license does not apply to the data — the data carries its own license per the source above. Distinct licenses for code and data is the standard pattern for MCPs that ship NO bundled corpus and instead build the database from upstream API at deploy time.
