# EU Law Integration — Usage Examples

> Real-world scenarios demonstrating Norwegian ↔ EU legal cross-referencing

## Table of Contents

1. [Data Protection Lawyer](#scenario-1-data-protection-lawyer)
2. [Procurement Officer](#scenario-2-procurement-officer)
3. [Academic Researcher](#scenario-3-academic-researcher)
4. [Corporate Compliance](#scenario-4-corporate-compliance)
5. [Tax Advisor](#scenario-5-tax-advisor)
6. [Environmental Consultant](#scenario-6-environmental-consultant)

---

## Scenario 1: Data Protection Lawyer

**Context:** Law firm representing client in GDPR compliance dispute. Need to understand Norwegian implementation of GDPR consent requirements.

### Question 1: What EU law does personopplysningsloven implement?

**MCP Tool Call:**
```json
{
  "tool": "get_eu_basis",
  "arguments": {
    "law_id": "LOV-2018-06-15-38",
    "include_articles": true
  }
}
```

**Expected Output:**
```json
{
  "statute": {
    "law_id": "LOV-2018-06-15-38",
    "law_title": "Personopplysningsloven (popplyl)",
    "status": "in_force",
    "in_force_date": "2018-07-20"
  },
  "eu_documents": [
    {
      "id": "regulation:2016/679",
      "type": "regulation",
      "year": 2016,
      "number": 679,
      "community": "EU",
      "celex_number": "32016R0679",
      "short_name": "GDPR",
      "title": "General Data Protection Regulation",
      "reference_type": "supplements",
      "is_primary_implementation": true,
      "articles": ["6.1", "7", "9.2", "13-15", "35", "77", "79"]
    }
  ],
  "total_references": 1,
  "_metadata": {
    "source": "Norwegian statute text (LOV-2018-06-15-38)",
    "extraction_method": "Automated parser",
    "verified": true
  }
}
```

**Interpretation:**
- popplyl is the **primary** Norwegian implementation of GDPR
- popplyl **supplements** GDPR (regulation already applies directly)
- Key articles cited: 6.1 (legal basis), 7 (consent conditions), 9.2 (sensitive data), 13-15 (transparency), 35 (DPIA), 77 (complaints), 79 (remedies)

---

### Question 2: What does personopplysningsloven kapittel 3 § 5 say about consent?

**MCP Tool Call:**
```json
{
  "tool": "get_provision",
  "arguments": {
    "law_id": "LOV-2018-06-15-38",
    "chapter": "3",
    "section": "5"
  }
}
```

**Expected Output:**
```json
{
  "provision": {
    "law_id": "LOV-2018-06-15-38",
    "provision_ref": "3:5",
    "chapter": "3",
    "section": "5",
    "title": "Rettslig grunnlag for behandling av personopplysninger",
    "content": "Personopplysninger kan bare behandles dersom... [full text]"
  }
}
```

---

### Question 3: What EU article does popplyl 3:5 implement?

**MCP Tool Call:**
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

**Expected Output:**
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
      "reference_type": "cites_article",
      "context": "Denne paragrafen supplerer artikkel 6.1 i Europaparlamentets og Radets forordning (EU) 2016/679..."
    }
  ]
}
```

**Interpretation:**
- popplyl 3:5 directly references **GDPR Article 6.1.a** (consent) and **6.1.c** (legal obligation)
- Norwegian law "supplements" (supplerer) the EU regulation

---

### Question 4: What was the government's reasoning?

**MCP Tool Call:**
```json
{
  "tool": "get_preparatory_works",
  "arguments": {
    "law_id": "LOV-2018-06-15-38"
  }
}
```

**Expected Output:**
```json
{
  "statute": {
    "law_id": "LOV-2018-06-15-38",
    "law_title": "Personopplysningsloven"
  },
  "preparatory_works": [
    {
      "id": "prop_56_l_2017_2018",
      "type": "proposition",
      "title": "Lov om behandling av personopplysninger",
      "issued_date": "2018-03-23",
      "url": "https://lovdata.no/dokument/PROP/forarbeid/prop-56-l-201718"
    }
  ]
}
```

**Follow-up:** Read Prop.56 L (2017-2018) to understand Norwegian implementation choices (not included in MCP, external research needed).

---

### Question 5: Any case law on consent requirements?

**MCP Tool Call:**
```json
{
  "tool": "search_case_law",
  "arguments": {
    "query": "samtykke personopplysninger GDPR",
    "court": "HR",
    "start_date": "2018-07-20"
  }
}
```

**Expected Output:**
```json
{
  "results": [
    {
      "id": "hr-2020-1945-a",
      "court": "HR",
      "date": "2020-09-15",
      "summary": "Sak om samtykke til behandling av personopplysninger...",
      "cited_statutes": ["LOV-2018-06-15-38"]
    }
  ],
  "total": 1
}
```

---

### Complete Legal Research Package

**Combine all sources:**
```json
{
  "tool": "build_legal_stance",
  "arguments": {
    "query": "GDPR consent requirements Norwegian law",
    "include_sources": ["legislation", "case_law", "preparatory_works"]
  }
}
```

**Result:** Comprehensive report with popplyl provisions, GDPR basis, HR case law, and Prop.56 L (2017-2018).

---

## Scenario 2: Procurement Officer

**Context:** Municipality planning procurement, needs to verify compliance with EU procurement directives.

### Question 1: Which EU directives govern Norwegian procurement?

**MCP Tool Call:**
```json
{
  "tool": "search_eu_implementations",
  "arguments": {
    "query": "procurement",
    "type": "directive"
  }
}
```

**Expected Output:**
```json
{
  "results": [
    {
      "id": "directive:2014/24",
      "type": "directive",
      "year": 2014,
      "number": 24,
      "celex_number": "32014L0024",
      "title": "Public procurement directive",
      "norwegian_implementations": 1
    },
    {
      "id": "directive:2014/25",
      "type": "directive",
      "year": 2014,
      "number": 25,
      "celex_number": "32014L0025",
      "title": "Procurement by entities in water, energy, transport and postal services",
      "norwegian_implementations": 1
    }
  ],
  "total_results": 2
}
```

---

### Question 2: Which Norwegian law implements the public procurement directive?

**MCP Tool Call:**
```json
{
  "tool": "get_norwegian_implementations",
  "arguments": {
    "eu_document_id": "directive:2014/24",
    "in_force_only": true
  }
}
```

**Expected Output:**
```json
{
  "eu_document": {
    "id": "directive:2014/24",
    "type": "directive",
    "celex_number": "32014L0024",
    "title": "Public procurement directive"
  },
  "implementations": [
    {
      "law_id": "LOV-2016-06-17-73",
      "law_title": "Anskaffelsesloven",
      "status": "in_force",
      "is_primary": true,
      "reference_type": "implements",
      "in_force_date": "2017-01-01"
    }
  ],
  "total_implementations": 1
}
```

**Interpretation:**
- Norwegian procurement is governed by **Anskaffelsesloven (LOV-2016-06-17-73)**
- Anskaffelsesloven implements **Directive 2014/24/EU**
- Law entered force **2017-01-01** (before directive's deadline)

---

### Question 3: Is Anskaffelsesloven still current?

**MCP Tool Call:**
```json
{
  "tool": "check_currency",
  "arguments": {
    "law_id": "LOV-2016-06-17-73"
  }
}
```

**Expected Output:**
```json
{
  "statute": {
    "law_id": "LOV-2016-06-17-73",
    "law_title": "Anskaffelsesloven",
    "status": "in_force",
    "in_force_date": "2017-01-01",
    "amendments": [
      "LOV-2019-06-21-42",
      "LOV-2020-12-11-146"
    ]
  },
  "is_current": true,
  "last_updated": "2020-12-01"
}
```

**Interpretation:**
- Anskaffelsesloven is **current** and in force
- Has been amended twice (2019, 2020)
- Safe to use for 2025 procurement planning

---

## Scenario 3: Academic Researcher

**Context:** PhD student studying Norwegian environmental law's relationship with EU regulations.

### Question 1: How much EU law is in Forurensningsloven?

**MCP Tool Call:**
```json
{
  "tool": "get_eu_basis",
  "arguments": {
    "law_id": "LOV-1981-03-13-6"
  }
}
```

**Expected Output:**
```json
{
  "statute": {
    "law_id": "LOV-1981-03-13-6",
    "law_title": "Forurensningsloven"
  },
  "eu_documents": [
    {
      "id": "regulation:1907/2006",
      "short_name": "REACH",
      "reference_type": "applies"
    },
    {
      "id": "directive:2010/75",
      "short_name": "IED",
      "reference_type": "implements"
    },
    {
      "id": "directive:2008/98",
      "short_name": "Waste Framework Directive",
      "reference_type": "implements"
    }
    // ... 68 more EU references
  ],
  "total_references": 71
}
```

**Interpretation:**
- Forurensningsloven has **71 EU references** (most of any Norwegian statute)
- Mix of regulations (apply directly) and directives (implemented)
- Covers chemicals (REACH), industrial emissions (IED), waste, water, air quality

---

### Question 2: Which Norwegian laws implement REACH?

**MCP Tool Call:**
```json
{
  "tool": "get_norwegian_implementations",
  "arguments": {
    "eu_document_id": "regulation:1907/2006"
  }
}
```

**Expected Output:**
```json
{
  "eu_document": {
    "id": "regulation:1907/2006",
    "short_name": "REACH",
    "type": "regulation"
  },
  "implementations": [
    {
      "law_id": "LOV-1981-03-13-6",
      "law_title": "Forurensningsloven",
      "is_primary": true,
      "reference_type": "applies"
    },
    {
      "law_id": "LOV-1976-06-11-79",
      "law_title": "Produktkontrolloven",
      "is_primary": false,
      "reference_type": "supplements"
    }
  ],
  "total_implementations": 2
}
```

**Research insight:** REACH is an EU **regulation** (directly applicable), but Norway has both Forurensningsloven and a specific product control law referencing it.

---

### Question 3: Compare EU influence across legal domains

**Batch Query (hypothetical):**
```javascript
const statutes = [
  "LOV-1981-03-13-6",   // Environmental (Forurensningsloven)
  "LOV-2018-06-15-38",  // Data protection (popplyl)
  "LOV-1997-06-13-44",  // Company law (Aksjeloven)
  "LOV-2005-06-17-62"   // Labor safety (Arbeidsmiljoloven)
];

for (const law of statutes) {
  const result = await getEUBasis(law);
  console.log(`${law}: ${result.total_references} EU references`);
}
```

**Output:**
```
LOV-1981-03-13-6: 71 EU references (Environmental)
LOV-2018-06-15-38: 1 EU reference (Data protection)
LOV-1997-06-13-44: 35 EU references (Company law)
LOV-2005-06-17-62: 33 EU references (Labor safety)
```

**Research conclusion:** Environmental and company law are **heavily Europeanized**, while data protection (GDPR) is a single comprehensive regulation.

---

## Scenario 4: Corporate Compliance

**Context:** Multinational corporation ensuring Norwegian subsidiary complies with EU financial reporting directives.

### Question 1: Which EU directives govern Norwegian annual reports?

**MCP Tool Call:**
```json
{
  "tool": "get_eu_basis",
  "arguments": {
    "law_id": "LOV-1998-07-17-56"
  }
}
```

**Expected Output:**
```json
{
  "statute": {
    "law_id": "LOV-1998-07-17-56",
    "law_title": "Regnskapsloven"
  },
  "eu_documents": [
    {
      "id": "directive:2013/34",
      "short_name": "Accounting Directive",
      "reference_type": "implements",
      "is_primary": true
    },
    {
      "id": "directive:2006/43",
      "short_name": "Statutory Audit Directive",
      "reference_type": "implements"
    }
    // ... 43 more references
  ],
  "total_references": 45
}
```

---

### Question 2: Verify audit requirements

**MCP Tool Call:**
```json
{
  "tool": "get_norwegian_implementations",
  "arguments": {
    "eu_document_id": "directive:2006/43",
    "in_force_only": true
  }
}
```

**Expected Output:**
```json
{
  "implementations": [
    {
      "law_id": "LOV-1998-07-17-56",
      "law_title": "Regnskapsloven",
      "is_primary": false
    },
    {
      "law_id": "LOV-1999-01-15-2",
      "law_title": "Revisorloven",
      "is_primary": true
    }
  ]
}
```

**Compliance action:** Review both **Regnskapsloven** (reporting) and **Revisorloven** (auditor requirements).

---

## Scenario 5: Tax Advisor

**Context:** Advising on Norwegian tax law's compliance with EU tax transparency directives (DAC6).

### Question 1: Does Norwegian tax law implement DAC6?

**MCP Tool Call:**
```json
{
  "tool": "search_eu_implementations",
  "arguments": {
    "query": "tax transparency DAC6",
    "type": "directive",
    "year_from": 2018
  }
}
```

**Expected Output:**
```json
{
  "results": [
    {
      "id": "directive:2018/822",
      "short_name": "DAC6",
      "title": "Mandatory disclosure of cross-border tax arrangements",
      "norwegian_implementations": 1
    }
  ]
}
```

---

### Question 2: Which Norwegian law implements DAC6?

**MCP Tool Call:**
```json
{
  "tool": "get_norwegian_implementations",
  "arguments": {
    "eu_document_id": "directive:2018/822"
  }
}
```

**Expected Output:**
```json
{
  "implementations": [
    {
      "law_id": "LOV-2005-06-17-67",
      "law_title": "Skatteforvaltningsloven",
      "is_primary": true,
      "reference_type": "implements",
      "in_force_date": "2020-07-01"
    }
  ]
}
```

**Compliance insight:** DAC6 is implemented in **Skatteforvaltningsloven** (tax administration law), effective 2020-07-01.

---

### Question 3: Any related case law?

**MCP Tool Call:**
```json
{
  "tool": "search_case_law",
  "arguments": {
    "query": "skatteopplysninger grenseoverskridende rapportering",
    "court": "HR",
    "start_date": "2020-07-01"
  }
}
```

**Expected Output:**
```json
{
  "results": [
    {
      "id": "hr-2022-1234-a",
      "summary": "Sak om rapportering av grenseoverskridende skatteordninger...",
      "cited_statutes": ["LOV-2005-06-17-67"]
    }
  ]
}
```

---

## Scenario 6: Environmental Consultant

**Context:** Environmental consultancy advising client on EU chemical regulations (REACH) compliance.

### Question 1: How does REACH apply in Norway?

**MCP Tool Call:**
```json
{
  "tool": "get_norwegian_implementations",
  "arguments": {
    "eu_document_id": "regulation:1907/2006",
    "in_force_only": true
  }
}
```

**Expected Output:**
```json
{
  "eu_document": {
    "id": "regulation:1907/2006",
    "short_name": "REACH",
    "type": "regulation",
    "title": "Registration, Evaluation, Authorisation of Chemicals"
  },
  "implementations": [
    {
      "law_id": "LOV-1981-03-13-6",
      "law_title": "Forurensningsloven",
      "reference_type": "applies",
      "is_primary": true
    }
  ]
}
```

**Interpretation:**
- REACH is an EU **regulation** (directly applicable, no transposition needed)
- Forurensningsloven **references** REACH but doesn't implement it
- Client must comply with REACH directly + Norwegian environmental law

---

### Question 2: Find relevant Forurensningsloven provisions

**MCP Tool Call:**
```json
{
  "tool": "search_legislation",
  "arguments": {
    "query": "kjemikalier farlige stoffer REACH",
    "document_id": "LOV-1981-03-13-6"
  }
}
```

**Expected Output:**
```json
{
  "results": [
    {
      "law_id": "LOV-1981-03-13-6",
      "provision_ref": "14:2",
      "content": "Kjemiske produkter og bioteknologi...REACH..."
    }
  ]
}
```

---

### Question 3: Build complete compliance picture

**MCP Tool Call:**
```json
{
  "tool": "build_legal_stance",
  "arguments": {
    "query": "chemical substances regulation Norway",
    "include_sources": ["legislation", "case_law"]
  }
}
```

**Expected Output:**
```json
{
  "legislation": [
    {
      "law_id": "LOV-1981-03-13-6",
      "law_title": "Forurensningsloven",
      "provisions": ["14:2", "14:5"]
    }
  ],
  "eu_basis": [
    {
      "id": "regulation:1907/2006",
      "short_name": "REACH"
    }
  ],
  "case_law": [
    {
      "court": "LB",
      "summary": "Tillatelse for handtering av kjemikalier..."
    }
  ]
}
```

**Compliance recommendation:** Client must comply with **both** REACH (EU regulation) **and** Forurensningsloven (Norwegian supplementary requirements).

---

## Interpretation Guidelines

### Reference Types

When you see these reference types, interpret as follows:

| Reference Type | Meaning | Action |
|----------------|---------|--------|
| `implements` | Norwegian law implements EU directive | Check both Norwegian law AND EU directive |
| `supplements` | Norwegian law supplements EU regulation | EU regulation applies + Norwegian additions |
| `applies` | EU regulation applies directly | Primary compliance is with EU law |
| `cites_article` | References specific EU article | Check exact EU article for requirements |
| `complies_with` | Ensures EU compliance | Norwegian law designed for EU compatibility |

### Common Pitfalls

1. **Assuming "implements" means EU directive doesn't apply**
   - Incorrect: Directive requirements still apply, Norwegian law just transposes them
   - Correct: Check both Norwegian implementation AND EU directive text

2. **Ignoring EU regulations because Norwegian law exists**
   - Incorrect: EU regulations apply **directly**, Norwegian law only supplements
   - Correct: Primary compliance is with EU regulation (e.g., GDPR)

3. **Not checking for amendments**
   - Incorrect: Assuming old EU directive still in force
   - Correct: Use `check_currency` or EUR-Lex to verify current status

4. **Confusing CELEX numbers**
   - Incorrect: "32016R0679" is just a complicated ID
   - Correct: CELEX = official EUR-Lex identifier for precise lookup

---

## Best Practices

### For Legal Professionals

1. **Start broad, narrow down:**
   - `search_eu_implementations` → `get_norwegian_implementations` → `get_provision_eu_basis`

2. **Verify critical citations:**
   - Use CELEX numbers to look up EU law on EUR-Lex
   - Cross-check with preparatory works for Norwegian implementation choices

3. **Check currency:**
   - Always use `check_currency` for statutes
   - Verify EU directive hasn't been amended (EUR-Lex)

4. **Combine sources:**
   - Use `build_legal_stance` for comprehensive research
   - Include case law and preparatory works

### For Researchers

1. **Quantitative analysis:**
   - Count EU references per statute for Europeanization metrics
   - Compare reference types across legal domains

2. **Historical comparison:**
   - Check repealed Norwegian laws (e.g., popplyl-2000 → popplyl)
   - Track when Norwegian law updated to reflect EU changes

3. **Citation networks:**
   - Map EU acts → Norwegian statutes → case law
   - Identify highly-referenced EU acts (GDPR, eIDAS)

### For Compliance Officers

1. **Dual compliance:**
   - For EU regulations: comply with EU law + Norwegian supplements
   - For EU directives: comply with Norwegian implementation

2. **Amendment monitoring:**
   - Subscribe to EUR-Lex notifications for relevant EU acts
   - Check Norwegian statute amendments quarterly

3. **Documentation:**
   - Keep CELEX numbers in compliance documentation
   - Link to both Norwegian law and EU law sources

---

## Additional Resources

- **EUR-Lex:** https://eur-lex.europa.eu/ (official EU law database)
- **Stortinget EU/EEA Info:** https://www.stortinget.no/no/Stortinget-og-demokratiet/Arbeidet/Eos-saker/
- **Norwegian Government EU/EEA Policy:** https://www.regjeringen.no/no/tema/europapolitikk/id115259/

---

**Last updated:** 2025-02-12
**Version:** 1.1.0 (EU Integration)
