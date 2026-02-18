# Coverage Limitations

This document details what legal sources are **NOT** included in this Tool and the impact on legal research completeness.

---

## Executive Summary

⚠️ **This Tool is Incomplete** — Critical legal sources are missing.

**Major Gaps:**
1. 🇪🇺 **EU Regulations and Directives** — Norwegian law increasingly implements EU/EEA law
2. ⚖️ **CJEU Case Law** — Court of Justice of the European Union (binding on Norwegian courts via EEA)
3. 📜 **Historical Statute Versions** — Limited availability of provision wording over time
4. 📚 **Legal Commentary** — No annotations, academic commentary, or practice guides
5. 🏛️ **Lower Court Decisions** — District and appellate courts largely missing
6. 📋 **Preparatory Works** — Limited coverage of propositioner and SOUs

**Impact**: Professional legal research using this Tool **will miss critical authorities** and must be supplemented with additional sources.

---

## 1. EU Law (Critical Gap)

### What's Missing

#### EU Regulations

**Examples:**
- **GDPR** (Regulation (EU) 2016/679) — Data protection
- **Digital Services Act** (Regulation (EU) 2022/2065) — Online platform liability
- **Markets in Crypto-Assets** (MiCA) (Regulation (EU) 2023/1114) — Cryptocurrency regulation
- **AI Act** (Regulation (EU) 2024/1689) — Artificial intelligence regulation

**Status in This Tool**: ❌ **Not Included**

**Why It Matters:**
- EU Regulations are applicable in Norway via the EEA Agreement (implementation required)
- EEA Agreement — EU/EEA law has primacy when incorporated
- Norwegian courts must apply EEA-relevant regulations alongside Norwegian statutes

#### EU Directives

**Examples:**
- **Whistleblower Protection Directive** (Directive (EU) 2019/1937)
- **Copyright in the Digital Single Market** (Directive (EU) 2019/790)
- **Shareholder Rights Directive II** (Directive (EU) 2017/828)

**Status in This Tool**: ❌ **Not Included**

**Why It Matters:**
- Norway transposes Directives into national law via the EEA Agreement (often visible in Norwegian statutes)
- Need EU Directive text to understand legislative intent and interpretation
- EFTA Court/CJEU interprets Directives — relevant for Norwegian courts

#### CJEU Case Law

**Court**: Court of Justice of the European Union (Luxembourg)

**Examples:**
- *Google Spain* (C-131/12) — Right to be forgotten (GDPR)
- *Schrems II* (C-311/18) — International data transfers
- *Viking Line* (C-438/05) — Freedom of establishment vs. labor rights
- *STX Norway* (E-2/11) — Posted workers in EEA context

**Status in This Tool**: ❌ **Not Included**

**Why It Matters:**
- EFTA Court decisions are **binding** on EEA EFTA states including Norway
- Homogeneity principle — CJEU interpretation is highly relevant for Norwegian courts
- Norwegian law must be interpreted consistently with EEA/CJEU precedent

---

### Impact on Norwegian Law Interpretation

**Problem**: Norwegian law is increasingly **enmeshed with EU/EEA law**. Researching Norwegian GDPR implementation (personopplysningsloven) without access to:
- EU GDPR text
- CJEU data protection case law
- European Data Protection Board (EDPB) guidelines

...results in **incomplete and potentially incorrect legal analysis**.

**Example Scenario:**

A lawyer searches this Tool for "data breach notification requirements" and finds:

```
Personopplysningsloven (LOV-2018-06-15-38) kapittel 3
"En behandlingsansvarlig skal melde fra om brudd pa personopplysningssikkerheten til Datatilsynet..."
```

**What's Missing:**
- GDPR Article 33 (source of Norwegian provision)
- EFTA Court/CJEU cases interpreting "without undue delay"
- EDPB guidelines on notification scope
- Article 29 Working Party opinions

Without these sources, the lawyer may:
- Miss EFTA Court/CJEU case law limiting Norwegian provision's scope
- Incorrectly apply Norwegian law where GDPR directly applies via EEA
- Fail to advise on cross-border notification obligations under GDPR

---

### Workaround

**Use Companion MCP Server:**

```json
{
  "mcpServers": {
    "norwegian-law": {
      "command": "npx",
      "args": ["-y", "@ansvar/norwegian-law-mcp"]
    },
    "eu-regulations": {
      "command": "npx",
      "args": ["-y", "@ansvar/eu-regulations-mcp"]
    }
  }
}
```

**[@ansvar/eu-regulations-mcp](https://github.com/Ansvar-Systems/EU_compliance_MCP)**: Companion server covering:
- EU Regulations and Directives
- CJEU case law (via EUR-Lex)
- EDPB guidelines and opinions
- European Commission guidance

**Combined Coverage**: Norwegian law + EU/EEA law = more complete legal research

---

## 2. Historical Statute Versions (Significant Gap)

### What's Missing

**Historical Provision Wording**: Provisions as they existed on specific dates in the past.

**Example:**
- **Current (2026)**: Personopplysningsloven LOV-2018-06-15-38 has been amended multiple times
- **Historical (2020)**: What did kapittel 3 say on 2020-06-15?

**Status in This Tool**:
- ⚠️ **Limited**: Some historical versions in `legal_provision_versions` table
- ❌ **Incomplete**: Not all amendments tracked
- ❌ **No Systematic Coverage**: Depends on manual ingestion of amendments

---

### Why Historical Versions Matter

#### Transitional Law Issues

**Scenario**: Contract signed in 2019 references personopplysningsloven. Dispute arises in 2026.

**Question**: Which version of personopplysningsloven applies — 2019 or 2026?

**Answer Depends On**:
- Transitional provisions in amending statute
- Lex posterior vs. lex specialis rules
- Contract interpretation principles (law at time of signing)

**This Tool Cannot Reliably Answer** without comprehensive historical version tracking.

---

#### Legal History Research

**Use Cases:**
- Academic research on legislative evolution
- Constitutional law challenges (was provision valid when enacted?)
- Human rights litigation (compliance with ECHR at time of events)

**Current Limitation**: Tool focuses on **current law**, not legal history.

---

### Workaround

**For Professional Use**:
- **Lovdata Pro**: Historical versions with annotations
- **Lovdata**: Query by publication date for original LOV text
- **Manual Research**: LOV archive at universities and law libraries

**For This Tool (Future Enhancement)**:
- Ingest all LOV amendments systematically
- Build provision version graph (valid_from, valid_to)
- Support `as_of_date` queries across all statutes

---

## 3. Legal Commentary and Annotations (Critical for Professional Use)

### What's Missing

**Doctrinal Commentary**:
- Academic articles and treatises
- Practitioner guides and handbooks
- Editorial annotations explaining application

**Practice Notes**:
- Precedent analysis ("this provision has been applied in X contexts")
- Drafting tips ("when citing this provision, note Y exception")
- Cross-references to related provisions and preparatory works

**Status in This Tool**: ❌ **Not Included** — Plain statutory text and case summaries only

---

### Why Commentary Matters

**Statutory Text is Ambiguous**: Norwegian law, like all law, requires interpretation.

**Example**: Personopplysningsloven (LOV-2018-06-15-38), kapittel 3

> "En behandlingsansvarlig skal melde fra om brudd pa personopplysningssikkerheten til Datatilsynet **uten ugrunnet opphold**..."

**Question**: What is "uten ugrunnet opphold" (without undue delay)?

**Answers Require Commentary**:
- Datatilsynet guidance: 72 hours in practice
- EFTA Court/CJEU case law on "without undue delay" under GDPR Article 33
- Academic debate on Norwegian vs. GDPR standard
- Practitioner experience from enforcement actions

**This Tool Provides**: Raw statute text
**Professional Research Requires**: Commentary explaining "72-hour rule" and IMY practice

---

### Workaround

**Commercial Databases**:
- **Gyldendal Rettsdata**: Extensive annotations by legal experts
- **Juridika**: Practice notes and commentary
- **Lovdata Pro**: Extended legal information

**Academic Resources**:
- **Lov og Rett**: Leading Norwegian law journal
- **Tidsskrift for Rettsvitenskap (TfR)**: Academic commentary
- University library databases (JSTOR, HeinOnline)

---

## 4. Lower Court Decisions (Major Gap in Case Law)

### What's Missing

**Courts NOT Comprehensively Covered**:
- **Tingretter** (District Courts) — Trial-level decisions
- **Lagmannsretter** (Courts of Appeal) — Appellate decisions
- **Forvaltningsdomstoler** (Administrative courts) — Limited in Norway

**Status in This Tool**:
- ✅ **Good Coverage**: Supreme Court (Hoyesterett/HR)
- ⚠️ **Partial Coverage**: Some appellate court decisions (via Lovdata)
- ❌ **Poor Coverage**: District and administrative courts

---

### Why Lower Courts Matter

#### Precedential Value

While Norwegian law is not strictly bound by stare decisis, lower court decisions:
- Indicate judicial trends and reasoning patterns
- Fill gaps where Supreme Court has not ruled
- Provide practical examples of statutory application
- Show how trial courts interpret ambiguous provisions

---

#### Volume of Law Practice

**Statistical Reality**:
- **99% of cases** are decided by lower courts (never reach Hoyesterett)
- **Practitioners need** to know how Tingrett judges interpret statutes
- **Supreme Court cases** are rare and may not address common issues

**This Tool's Bias**: Skewed toward Supreme Court decisions, missing the **bulk of judicial practice**.

---

### Workaround

**Official Sources**:
- **Domstol.no**: Individual court websites publish selected decisions
- **Lovdata Pro**: Commercial database with lower court decisions

**Practical Research**:
- Contact clerks at relevant Tingrett/Lagmannsrett
- Freedom of Information requests (offentlighetsprinsippet) for specific cases

---

## 5. Preparatory Works (Significant Gap)

### What's Missing

**Forarbeider (Preparatory Works)**:
- **Proposisjoner** (Government Bills) — Detailed legislative intent and commentary
- **NOU** (Norges offentlige utredninger) — Official government investigations
- **Horing** (Consultation papers) — Departmental memoranda

**Status in This Tool**:
- ⚠️ **Limited**: Some preparatory works linked in `preparatory_works` table
- ❌ **Not Comprehensive**: Only manually ingested works included
- ❌ **No Full Text**: Summaries only, not full proposition/SOU text

---

### Why Forarbeider Matter

**Norwegian Legal Method**: Statutory interpretation heavily relies on forarbeider.

**Hierarchy of Interpretation**:
1. Statutory text (ordlyden)
2. **Forarbeider** — Legislative history and intent
3. Systematic interpretation (systematikken)
4. Teleological interpretation (formalet)

**Forarbeider are authoritative** for understanding ambiguous provisions.

**Example**: Personopplysningsloven (LOV-2018-06-15-38)

**Question**: Does "behandlingsansvarlig" include small non-profits?

**Answer Found In**: Prop.56 L (2017-2018), p. 152 (Government Bill)
> "Ogsa sma ideelle organisasjoner omfattes av ansvarsbegrepet dersom de behandler personopplysninger..."

**This Tool**: ❌ Does not include Prop.56 L (2017-2018) full text

---

### Workaround

**Official Source**:
- **Stortinget.no**: Full-text propositions and NOUs freely available
- **Lovdata**: Links to preparatory works for each statute

**Commercial Databases**:
- **Gyldendal Rettsdata/Juridika**: Indexed and searchable preparatory works with cross-references

**This Tool (Future Enhancement)**:
- Ingest full-text propositions via Stortinget/Lovdata
- Link provisions to specific paragraphs in forarbeider
- Full-text search across preparatory works

---

## 6. Administrative Regulations (Forskrifter)

### What's Missing

**Subordinate Legislation**:
- **Forskrifter** — Government regulations implementing statutes
- **Rundskriv** — Agency circulars (e.g., Datatilsynet guidelines)
- **EU Implementing Acts** — Commission regulations

**Status in This Tool**: ❌ **Not Included**

---

### Why Forskrifter Matter

**Statutory Delegation**: Statutes often delegate details to forskrifter.

**Example**: Personopplysningsloven (LOV-2018-06-15-38)

> "Kongen kan gi forskrift om **botestraff**..."

**Implementation**: Personopplysningsforskriften — Government regulation

**This Tool Has**: Personopplysningsloven (statute)
**This Tool Missing**: Personopplysningsforskriften (implementing regulation with penalty details)

**Result**: Incomplete picture of data protection law without forskrifter.

---

### Workaround

**Official Sources**:
- **Lovdata**: Includes forskrifter alongside lover
- **Rettsinfo**: Links to related forskrifter
- **Agency websites**: Rundskriv published by Datatilsynet, Finanstilsynet, etc.

**This Tool (Future Enhancement)**:
- Ingest forskrifter alongside statutes
- Link statutes to implementing regulations
- Include agency guidelines and interpretive rules

---

## 7. International Treaties and Conventions

### What's Missing

**Treaties Norway Has Ratified**:
- **ECHR** (European Convention on Human Rights)
- **ICCPR** (International Covenant on Civil and Political Rights)
- **Geneva Conventions** (International humanitarian law)
- **Bilateral investment treaties** (BITs)

**Status in This Tool**: ❌ **Not Included**

---

### Why Treaties Matter

**Constitutional Incorporation**: Norway is **dualist** — treaties must be incorporated into Norwegian law.

**But**: ECtHR (European Court of Human Rights) case law heavily influences Norwegian courts.

**Example**: ECHR Article 8 (right to privacy)
- Incorporated via Menneskerettsloven (LOV-1999-05-21-30)
- ECtHR case law binding on Norwegian courts
- Influences interpretation of Norwegian privacy laws

**This Tool**: ❌ Does not include Menneskerettsloven or ECtHR case law

---

### Workaround

**Official Sources**:
- **ECHR**: https://www.echr.coe.int/
- **HUDOC**: ECtHR case law database
- **UN Treaty Collection**: International human rights treaties

**Commercial Databases**:
- **Gyldendal Rettsdata/Juridika**: Include ECHR and other key treaties

---

## 8. Legal Definitions and Terminology

### What's Missing

**Legal Dictionary**:
- Norwegian-English legal terms
- Definitions of juridiske termer (legal terms of art)
- Cross-references between concepts

**Status in This Tool**: ⚠️ **Limited** — Some definitions in `definitions` table, but not comprehensive

---

### Why Definitions Matter

**Example**: "Verge" vs. "Fremtidsfullmakt"

**Question**: What's the difference?

**This Tool**: May find statutes mentioning both, but no definitional guidance

**Professional Databases**: Include legal dictionaries explaining distinction:
- **Verge**: Guardian appointed by court for persons lacking legal capacity
- **Fremtidsfullmakt**: Power of attorney granted for future incapacity

---

### Workaround

**Resources**:
- **Juridisk ordbok**: Norwegian-English legal dictionary
- **Gyldendal Rettsdata**: Built-in legal glossary
- **Juridika**: Terminology search across sources

**This Tool (Future Enhancement)**:
- Expand `definitions` table systematically
- Link definitions to provisions where terms are used
- Norwegian-English terminology mapping

---

## Coverage Summary Matrix

| Legal Source | Coverage | Impact on Professional Use | Workaround |
|--------------|----------|---------------------------|------------|
| **Norwegian Statutes (LOV)** | ✅ Good | Low | N/A |
| **Norwegian Case Law (HR)** | ✅ Good | Low | Verify with Lovdata |
| **Norwegian Case Law (Lower Courts)** | ⚠️ Partial | Medium | Lovdata Pro, Domstol.no |
| **EU Regulations** | ❌ Missing | **High** | @ansvar/eu-regulations-mcp |
| **EU Directives** | ❌ Missing | **High** | @ansvar/eu-regulations-mcp |
| **CJEU Case Law** | ❌ Missing | **High** | EUR-Lex, Gyldendal Rettsdata |
| **Historical Statute Versions** | ⚠️ Limited | Medium | Lovdata Pro |
| **Legal Commentary** | ❌ Missing | **High** | Gyldendal Rettsdata, Juridika, academic journals |
| **Preparatory Works (Full Text)** | ⚠️ Partial | Medium-High | Stortinget.no, Lovdata |
| **Forskrifter (Regulations)** | ❌ Missing | Medium | Lovdata, Rettsinfo |
| **International Treaties** | ❌ Missing | Medium | ECHR, HUDOC, UN Treaty |
| **Legal Definitions** | ⚠️ Limited | Low-Medium | Juridisk ordbok, Gyldendal Rettsdata |

---

## Recommended Multi-Source Research Strategy

### For Professional Legal Work

**1. Initial Research** (This Tool)
- Quick statutory lookups
- Case law keyword search
- Preliminary hypothesis generation

**2. EU Law Layer** (@ansvar/eu-regulations-mcp)
- Identify applicable EU Regulations/Directives
- Check CJEU case law on interpretation
- Review EDPB/Commission guidance

**3. Official Verification** (Lovdata.no, Stortinget.no)
- Verify statute currency and amendments
- Check official case law citations
- Access preparatory works

**4. Professional Database** (Gyldendal Rettsdata, Juridika)
- Read editorial commentary and annotations
- Review practice notes and precedent analysis
- Check cross-references and related sources
- Confirm no recent developments missed

**5. Academic Research** (If Needed)
- Lov og Rett, TfR articles
- Doctoral dissertations and treatises
- Comparative law sources

---

## Future Roadmap: Expanding Coverage

### Planned Enhancements

**Near-Term (Next 6 Months)**:
- [ ] Full-text preparatory works (propositions, NOUs)
- [ ] Forskrifter (government regulations)
- [ ] Expanded definitions table
- [ ] Historical statute version tracking

**Medium-Term (6-12 Months)**:
- [ ] Integration with @ansvar/eu-regulations-mcp (EU law layer)
- [ ] ECHR and ECtHR case law
- [ ] Lower court decision ingestion (via Domstol.no)
- [ ] Legal commentary integration (if licensed sources available)

**Long-Term (12+ Months)**:
- [ ] Nordic law integration (Sweden, Denmark, Finland)
- [ ] Comparative law sources
- [ ] AI-powered cross-referencing and relationship mapping

---

## How to Request Coverage Expansion

**Want a specific legal source added?**

1. **Open GitHub Issue**: https://github.com/Ansvar-Systems/norwegian-law-mcp/issues
2. **Label**: `coverage-enhancement`
3. **Include**:
   - Source name and URL
   - License status (open data, API terms, copyright)
   - Use case (why this source matters for legal research)
   - Estimated impact (how many users would benefit)

**Community Contributions Welcome**: If you have expertise in a specific legal area and want to contribute data or parsers, see [CONTRIBUTING.md](CONTRIBUTING.md).

---

## Summary: What This Tool Is NOT

❌ **NOT a complete legal research platform**
❌ **NOT a substitute for Gyldendal Rettsdata/Juridika/commercial databases**
❌ **NOT comprehensive without EU law integration**
❌ **NOT authoritative for professional legal work without verification**
❌ **NOT a replacement for reading preparatory works and commentary**

**This Tool Is**:
✅ A **starting point** for legal research
✅ A **supplement** to professional databases
✅ A **rapid lookup** tool for known citations
✅ An **open-source alternative** for preliminary research

**Golden Rule**: Use this Tool as **one source among many**, not the sole basis for legal conclusions.

---

**Last Updated**: 2026-02-12
**Tool Version**: 0.1.0 (Pilot/Research)
