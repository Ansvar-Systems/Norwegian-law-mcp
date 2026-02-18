# EU Law Integration Guide

> Comprehensive guide to Norwegian ↔ EU legal cross-referencing in the Norwegian Law MCP server

## Table of Contents

1. [Overview](#overview)
2. [Understanding the Norwegian-EU Legal Relationship](#understanding-the-norwegian-eu-legal-relationship)
3. [How to Use the EU Tools](#how-to-use-the-eu-tools)
4. [CELEX Numbers Explained](#celex-numbers-explained)
5. [Example Workflows](#example-workflows)
6. [Data Limitations & Disclaimers](#data-limitations--disclaimers)
7. [Future Enhancements](#future-enhancements)

---

## Overview

The Norwegian Law MCP server includes **682 cross-references** linking **49 Norwegian statutes** to **227 EU directives and regulations**. This enables bi-directional legal research across Norwegian and European legal frameworks.

### What's Included

- **EU basis lookup:** Find which EU directives/regulations a Norwegian statute implements
- **Norwegian implementation lookup:** Find which Norwegian laws implement a specific EU act
- **Provision-level granularity:** Many references linked to specific statute sections
- **Article citations:** Specific EU article references when available
- **Implementation metadata:** Primary vs supplementary implementation tracking
- **CELEX numbers:** Official EU document identifiers

### What's NOT Included

- Full text of EU directives/regulations (use @ansvar/eu-regulations-mcp)
- CJEU (Court of Justice of the European Union) case law
- EU Commission decisions and recommendations
- Lower-level EU implementing acts
- Real-time updates from EUR-Lex

---

## Understanding the Norwegian-EU Legal Relationship

### Directives vs Regulations

**EU Directives:**
- Binding on EU/EEA member states but require national implementation
- States must achieve the directive's objectives via national legislation
- Implementation deadline specified in directive
- Example: Data Protection Directive (95/46/EG) → implemented via popplyl-2000 (old personopplysningsloven)

**EU Regulations:**
- Directly applicable in all member states (via EEA Agreement for Norway)
- No national implementation required (but may be supplemented)
- Immediately enforceable
- Example: GDPR (2016/679) → directly applies, but Norway passed personopplysningsloven (LOV-2018-06-15-38) to supplement it

### Norwegian Implementation Process

1. **EU adopts directive/regulation**
2. **Norwegian government analyzes** implementation needs (via EEA Agreement)
3. **Proposition (Prop.)** prepared explaining Norwegian approach
4. **Stortinget passes law** implementing directive
5. **Law enters force** (usually by directive's deadline)

### Reference Types in Database

| Type | Meaning | Example |
|------|---------|---------|
| `implements` | Norwegian law implements EU directive | popplyl implements GDPR |
| `supplements` | Norwegian law supplements EU regulation | popplyl supplements GDPR |
| `applies` | EU regulation applies directly | GDPR applies in Norway |
| `cites_article` | References specific EU article | popplyl kapittel 3 § 5 cites GDPR Art. 6.1.a |
| `references` | General reference to EU law | offentleglova references ePrivacy Directive |
| `complies_with` | Norwegian law ensures EU compliance | Tax law complies with DAC6 |

---

## How to Use the EU Tools

### Tool 1: `get_eu_basis` — Find EU Law for Norwegian Statute

**Use when:** You have a Norwegian statute and want to know which EU law it's based on.

**Parameters:**
- `law_id` (required) — e.g., "LOV-2018-06-15-38"
- `include_articles` (optional) — Set to `true` to see specific article references

**Example:**
```json
{
  "tool": "get_eu_basis",
  "arguments": {
    "law_id": "LOV-2018-06-15-38",
    "include_articles": true
  }
}
```

**Returns:**
```json
{
  "statute": {
    "law_id": "LOV-2018-06-15-38",
    "law_title": "Personopplysningsloven"
  },
  "eu_documents": [
    {
      "id": "regulation:2016/679",
      "type": "regulation",
      "year": 2016,
      "number": 679,
      "celex_number": "32016R0679",
      "short_name": "GDPR",
      "title": "General Data Protection Regulation",
      "reference_type": "supplements",
      "is_primary_implementation": true,
      "articles": ["6.1.a", "7", "13-15", "35"]
    }
  ],
  "total_references": 1
}
```

**Interpretation:**
- popplyl is the **primary** Norwegian implementation of GDPR
- popplyl **supplements** GDPR (regulation applies directly, popplyl adds Norwegian specifics)
- Specific GDPR articles cited: 6.1.a (consent), 7 (consent conditions), 13-15 (transparency), 35 (DPIA)

---

### Tool 2: `get_norwegian_implementations` — Find Norwegian Law for EU Act

**Use when:** You have an EU directive/regulation and want to find Norwegian implementations.

**Parameters:**
- `eu_document_id` (required) — Format: "directive:YYYY/NNN" or "regulation:YYYY/NNN"
- `primary_only` (optional) — Show only primary implementations
- `in_force_only` (optional) — Exclude repealed laws

**Example:**
```json
{
  "tool": "get_norwegian_implementations",
  "arguments": {
    "eu_document_id": "regulation:2016/679",
    "in_force_only": true
  }
}
```

**Returns:**
```json
{
  "eu_document": {
    "id": "regulation:2016/679",
    "type": "regulation",
    "celex_number": "32016R0679",
    "short_name": "GDPR"
  },
  "implementations": [
    {
      "law_id": "LOV-2018-06-15-38",
      "law_title": "Personopplysningsloven",
      "status": "in_force",
      "is_primary": true,
      "reference_type": "supplements",
      "in_force_date": "2018-07-20"
    },
    {
      "law_id": "LOV-2006-05-19-16",
      "law_title": "Offentleglova",
      "status": "in_force",
      "is_primary": false,
      "reference_type": "complies_with",
      "in_force_date": "2009-01-01"
    }
  ],
  "total_implementations": 2
}
```

**Interpretation:**
- GDPR has **two** Norwegian implementations
- **Primary:** popplyl (LOV-2018-06-15-38) — dedicated GDPR implementation law
- **Supplementary:** offentleglova (LOV-2006-05-19-16) — public access law ensuring GDPR compliance

---

### Tool 3: `search_eu_implementations` — Search EU Documents

**Use when:** You want to find EU acts by keyword or topic.

**Parameters:**
- `query` (required) — Search keywords
- `type` (optional) — Filter by "directive" or "regulation"
- `year_from`, `year_to` (optional) — Year range filter

**Example:**
```json
{
  "tool": "search_eu_implementations",
  "arguments": {
    "query": "data protection privacy",
    "type": "regulation",
    "year_from": 2010
  }
}
```

**Returns:**
```json
{
  "results": [
    {
      "id": "regulation:2016/679",
      "type": "regulation",
      "year": 2016,
      "celex_number": "32016R0679",
      "short_name": "GDPR",
      "norwegian_implementations": 2,
      "in_force": true
    }
  ],
  "total_results": 1
}
```

---

### Tool 4: `get_provision_eu_basis` — EU Basis for Specific Provision

**Use when:** You want to know the EU law basis for a specific statute section.

**Parameters:**
- `law_id` (required) — Norwegian statute
- `chapter` (optional) — Chapter number
- `section` (required) — Section reference

**Example:**
```json
{
  "tool": "get_provision_eu_basis",
  "arguments": {
    "law_id": "LOV-2018-06-15-38",
    "chapter": "3",
    "section": "5"
  }
}
```

**Returns:**
```json
{
  "provision": {
    "law_id": "LOV-2018-06-15-38",
    "provision_ref": "3:5",
    "title": "Rettslig grunnlag for behandling av personopplysninger"
  },
  "eu_references": [
    {
      "eu_document_id": "regulation:2016/679",
      "short_name": "GDPR",
      "articles": ["6.1.a", "6.1.c"],
      "reference_type": "cites_article"
    }
  ],
  "context": "Denne paragrafen supplerer artikkel 6.1 i EUs personvernforordning..."
}
```

**Interpretation:**
- popplyl kapittel 3 § 5 directly implements **GDPR Article 6.1.a and 6.1.c**
- Context shows the Norwegian law "supplements" (supplerer) the EU regulation

---

### Tool 5: `validate_eu_compliance` — Check Implementation Status

**Status:** Future feature (requires @ansvar/eu-regulations-mcp integration)

**Will enable:**
- Side-by-side comparison of Norwegian law vs EU requirement
- Identification of implementation gaps
- Validation of article-by-article transposition
- Gold-plating detection (Norwegian provisions exceeding EU requirements)

---

## CELEX Numbers Explained

CELEX is the official EU document numbering system used by EUR-Lex.

### Format: `3YYYYXNNNNN`

- **3** — Sector code for EU legislation
- **YYYY** — Year of adoption
- **X** — Document type:
  - **L** = Directive (Legal act)
  - **R** = Regulation
- **NNNNN** — Sequential number (zero-padded to 4 digits)

### Examples

| EU Act | CELEX Number | Breakdown |
|--------|--------------|-----------|
| GDPR (regulation:2016/679) | 32016R0679 | 3-2016-R-0679 |
| Data Protection Directive (directive:1995/46) | 31995L0046 | 3-1995-L-0046 |
| eIDAS (regulation:910/2014) | 32014R0910 | 3-2014-R-0910 |

### Using CELEX Numbers

CELEX numbers can be used to:
- Look up full EU law text on EUR-Lex: `https://eur-lex.europa.eu/eli/[type]/[year]/[number]`
- Cross-reference with @ansvar/eu-regulations-mcp
- Validate EU document authenticity

**Example URL:**
- GDPR: `https://eur-lex.europa.eu/eli/reg/2016/679`

---

## Example Workflows

### Workflow 1: GDPR Compliance Research

**Scenario:** Law firm researching Norwegian GDPR compliance requirements

**Steps:**

1. **Find EU basis for personopplysningsloven**
   ```json
   {"tool": "get_eu_basis", "arguments": {"law_id": "LOV-2018-06-15-38"}}
   ```
   Result: GDPR (regulation:2016/679)

2. **Find all Norwegian GDPR implementations**
   ```json
   {"tool": "get_norwegian_implementations", "arguments": {"eu_document_id": "regulation:2016/679"}}
   ```
   Result: popplyl, offentleglova

3. **Check specific provision (consent)**
   ```json
   {"tool": "get_provision_eu_basis", "arguments": {"law_id": "LOV-2018-06-15-38", "chapter": "3", "section": "5"}}
   ```
   Result: GDPR Article 6.1.a

4. **Review preparatory works**
   ```json
   {"tool": "get_preparatory_works", "arguments": {"law_id": "LOV-2018-06-15-38"}}
   ```
   Result: Prop.56 L (2017-2018) (explains Norwegian GDPR choices)

**Outcome:** Comprehensive understanding of Norwegian GDPR implementation with EU basis and legislative intent.

---

### Workflow 2: Procurement Directive Transposition

**Scenario:** Public sector agency verifying procurement law compliance

**Steps:**

1. **Search EU procurement directives**
   ```json
   {"tool": "search_eu_implementations", "arguments": {"query": "procurement", "type": "directive"}}
   ```
   Result: Directive 2014/24/EU (public sector), 2014/25/EU (utilities)

2. **Find Norwegian implementation**
   ```json
   {"tool": "get_norwegian_implementations", "arguments": {"eu_document_id": "directive:2014/24"}}
   ```
   Result: Anskaffelsesloven (LOV-2016-06-17-73)

3. **Verify implementation status**
   ```json
   {"tool": "check_currency", "arguments": {"law_id": "LOV-2016-06-17-73"}}
   ```
   Result: In force since 2017-01-01

**Outcome:** Confirmed that Norwegian procurement law properly implements EU directive.

---

### Workflow 3: Environmental Law Research

**Scenario:** Academic studying Norwegian environmental law's EU basis

**Steps:**

1. **Get EU basis for Forurensningsloven**
   ```json
   {"tool": "get_eu_basis", "arguments": {"law_id": "LOV-1981-03-13-6"}}
   ```
   Result: 71 EU references (REACH, IED, Waste Framework, etc.)

2. **Analyze specific regulation (REACH)**
   ```json
   {"tool": "get_norwegian_implementations", "arguments": {"eu_document_id": "regulation:1907/2006"}}
   ```
   Result: Forurensningsloven + sector-specific laws

3. **Build legal stance on chemical regulation**
   ```json
   {"tool": "build_legal_stance", "arguments": {"query": "chemical substances regulation"}}
   ```
   Result: Forurensningsloven provisions + REACH + Norwegian case law + preparatory works

**Outcome:** Comprehensive understanding of Norwegian chemical regulation's EU basis.

---

## Data Limitations & Disclaimers

### Data Source Limitations

1. **Text-Based Extraction**
   - EU references are **parsed from Norwegian statute text**
   - Not sourced from official EU databases
   - Parser accuracy: ~95% (some edge cases missed)

2. **No Full EU Law Text**
   - Only EU document IDs and metadata included
   - Full directive/regulation text requires EUR-Lex or @ansvar/eu-regulations-mcp
   - Article citations are extracted but not validated against EU text

3. **Historical Coverage Gaps**
   - Older EEG directives may have incomplete metadata
   - Some historical implementations via regulations (not statutes) may be missed
   - Pre-1995 EU law less comprehensively covered

4. **No Real-Time Updates**
   - EU law amendments not automatically reflected
   - Norwegian statute amendments may add/remove EU references
   - Manual updates required

### Legal Disclaimers

⚠️ **NOT LEGAL ADVICE** — This tool is for research purposes only.

**Professional Use:**
- Always verify critical EU citations against EUR-Lex
- Check for EU directive amendments that may affect Norwegian law
- Consult preparatory works for implementation choices
- Validate transposition deadlines and Norwegian compliance

**Verified-Data-Only Approach:**
- All 682 references extracted from verified Norwegian statute text
- No AI-generated or synthesized EU citations
- All CELEX numbers follow official format
- However, errors in Norwegian statute text will propagate to database

**Confidentiality:**
- EU cross-reference queries go through Claude API
- For privileged matters, use on-premise deployment
- See [PRIVACY.md](../PRIVACY.md) for Advokatforeningen compliance

---

## Future Enhancements

### Phase 1: EUR-Lex Metadata (Planned Q2 2025)

- Fetch official EU titles (Norwegian and English)
- Add EU directive adoption dates
- Add transposition deadlines
- Mark repealed/amended EU acts

### Phase 2: @ansvar/eu-regulations-mcp Integration (Planned Q3 2025)

**Will enable:**
- Full EU directive/regulation text retrieval by CELEX number
- Side-by-side Norwegian/EU provision comparison
- Article-by-article transposition validation
- Automated compliance gap analysis

**Example future query:**
```json
{
  "tool": "compare_implementation",
  "arguments": {
    "law_id": "LOV-2018-06-15-38",
    "chapter": "3",
    "section": "5",
    "eu_article": "6.1.a"
  }
}
```

Returns: Norwegian text vs EU text with delta analysis.

### Phase 3: CJEU Case Law (Planned Q4 2025)

- Court of Justice of the European Union decisions
- Preliminary rulings affecting Norwegian law
- Cross-references between Norwegian cases and CJEU
- Integration with @ansvar/eu-regulations-mcp CJEU database

### Phase 4: Amendment Tracking (2026)

- Track when EU directives are amended
- Alert when Norwegian implementation needs update
- Historical timeline of EU law → Norwegian law changes
- Automatic transposition deadline monitoring

---

## Resources

### Official EU Resources

- **EUR-Lex:** https://eur-lex.europa.eu/ — Official EU law database
- **CELEX Search:** https://eur-lex.europa.eu/content/tools/TableOfSectors/types_of_documents_in_eurlex.html
- **EU Institutions:** https://europa.eu/european-union/about-eu/institutions-bodies_en

### Norwegian Resources

- **Stortinget EU/EEA Info:** https://www.stortinget.no/no/Stortinget-og-demokratiet/Arbeidet/Eos-saker/
- **Norwegian Government EU/EEA Policy:** https://www.regjeringen.no/no/tema/europapolitikk/id115259/
- **Rettsinfo:** https://lovdata.no/ — Norwegian legal information

### Related MCP Servers

- **@ansvar/eu-regulations-mcp** — Full EU law text and CJEU case law (coming soon)
- **@ansvar/norwegian-law-mcp** — This server (Norwegian law with EU cross-references)

---

## Support

Questions or issues with EU integration?

- **GitHub Issues:** https://github.com/Ansvar-Systems/norwegian-law-mcp/issues
- **Email:** contact@ansvar.ai
- **Documentation:** See [EU_USAGE_EXAMPLES.md](EU_USAGE_EXAMPLES.md) for practical examples

---

**Last updated:** 2025-02-12
**Version:** 1.1.0 (EU Integration)
**Coverage:** 682 EU references, 227 documents, 49 Norwegian statutes
