/**
 * Test database fixture with Norwegian law sample data.
 */

import Database from '@ansvar/mcp-sqlite';

const SCHEMA = `
CREATE TABLE legal_documents (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('statute', 'bill', 'sou', 'ds', 'case_law')),
  title TEXT NOT NULL,
  title_en TEXT,
  short_name TEXT,
  status TEXT NOT NULL DEFAULT 'in_force'
    CHECK(status IN ('in_force', 'amended', 'repealed', 'not_yet_in_force')),
  issued_date TEXT,
  in_force_date TEXT,
  url TEXT,
  description TEXT,
  last_updated TEXT DEFAULT (datetime('now'))
);

CREATE TABLE legal_provisions (
  id INTEGER PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES legal_documents(id),
  provision_ref TEXT NOT NULL,
  chapter TEXT,
  section TEXT NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  metadata TEXT,
  UNIQUE(document_id, provision_ref)
);

CREATE INDEX idx_provisions_doc ON legal_provisions(document_id);
CREATE INDEX idx_provisions_chapter ON legal_provisions(document_id, chapter);

CREATE VIRTUAL TABLE provisions_fts USING fts5(
  content, title,
  content='legal_provisions',
  content_rowid='id',
  tokenize='unicode61'
);

CREATE TRIGGER provisions_ai AFTER INSERT ON legal_provisions BEGIN
  INSERT INTO provisions_fts(rowid, content, title)
  VALUES (new.id, new.content, new.title);
END;

CREATE TRIGGER provisions_ad AFTER DELETE ON legal_provisions BEGIN
  INSERT INTO provisions_fts(provisions_fts, rowid, content, title)
  VALUES ('delete', old.id, old.content, old.title);
END;

CREATE TRIGGER provisions_au AFTER UPDATE ON legal_provisions BEGIN
  INSERT INTO provisions_fts(provisions_fts, rowid, content, title)
  VALUES ('delete', old.id, old.content, old.title);
  INSERT INTO provisions_fts(rowid, content, title)
  VALUES (new.id, new.content, new.title);
END;

CREATE TABLE legal_provision_versions (
  id INTEGER PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES legal_documents(id),
  provision_ref TEXT NOT NULL,
  chapter TEXT,
  section TEXT NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  metadata TEXT,
  valid_from TEXT,
  valid_to TEXT
);

CREATE INDEX idx_provision_versions_doc_ref ON legal_provision_versions(document_id, provision_ref);

CREATE VIRTUAL TABLE provision_versions_fts USING fts5(
  content, title,
  content='legal_provision_versions',
  content_rowid='id',
  tokenize='unicode61'
);

CREATE TRIGGER provision_versions_ai AFTER INSERT ON legal_provision_versions BEGIN
  INSERT INTO provision_versions_fts(rowid, content, title)
  VALUES (new.id, new.content, new.title);
END;

CREATE TRIGGER provision_versions_ad AFTER DELETE ON legal_provision_versions BEGIN
  INSERT INTO provision_versions_fts(provision_versions_fts, rowid, content, title)
  VALUES ('delete', old.id, old.content, old.title);
END;

CREATE TRIGGER provision_versions_au AFTER UPDATE ON legal_provision_versions BEGIN
  INSERT INTO provision_versions_fts(provision_versions_fts, rowid, content, title)
  VALUES ('delete', old.id, old.content, old.title);
  INSERT INTO provision_versions_fts(rowid, content, title)
  VALUES (new.id, new.content, new.title);
END;

CREATE TABLE case_law (
  id INTEGER PRIMARY KEY,
  document_id TEXT NOT NULL UNIQUE REFERENCES legal_documents(id),
  court TEXT NOT NULL,
  case_number TEXT,
  decision_date TEXT,
  summary TEXT,
  keywords TEXT
);

CREATE VIRTUAL TABLE case_law_fts USING fts5(
  summary, keywords,
  content='case_law',
  content_rowid='id',
  tokenize='unicode61'
);

CREATE TRIGGER case_law_ai AFTER INSERT ON case_law BEGIN
  INSERT INTO case_law_fts(rowid, summary, keywords)
  VALUES (new.id, new.summary, new.keywords);
END;

CREATE TRIGGER case_law_ad AFTER DELETE ON case_law BEGIN
  INSERT INTO case_law_fts(case_law_fts, rowid, summary, keywords)
  VALUES ('delete', old.id, old.summary, old.keywords);
END;

CREATE TABLE preparatory_works (
  id INTEGER PRIMARY KEY,
  statute_id TEXT NOT NULL REFERENCES legal_documents(id),
  prep_document_id TEXT NOT NULL REFERENCES legal_documents(id),
  title TEXT,
  summary TEXT
);

CREATE INDEX idx_prep_statute ON preparatory_works(statute_id);

CREATE VIRTUAL TABLE prep_works_fts USING fts5(
  title, summary,
  content='preparatory_works',
  content_rowid='id',
  tokenize='unicode61'
);

CREATE TRIGGER prep_works_ai AFTER INSERT ON preparatory_works BEGIN
  INSERT INTO prep_works_fts(rowid, title, summary)
  VALUES (new.id, new.title, new.summary);
END;

CREATE TRIGGER prep_works_ad AFTER DELETE ON preparatory_works BEGIN
  INSERT INTO prep_works_fts(prep_works_fts, rowid, title, summary)
  VALUES ('delete', old.id, old.title, old.summary);
END;

CREATE TABLE cross_references (
  id INTEGER PRIMARY KEY,
  source_document_id TEXT NOT NULL REFERENCES legal_documents(id),
  source_provision_ref TEXT,
  target_document_id TEXT NOT NULL REFERENCES legal_documents(id),
  target_provision_ref TEXT,
  ref_type TEXT NOT NULL DEFAULT 'references'
    CHECK(ref_type IN ('references', 'amended_by', 'implements', 'see_also'))
);

CREATE INDEX idx_xref_source ON cross_references(source_document_id);
CREATE INDEX idx_xref_target ON cross_references(target_document_id);

CREATE TABLE definitions (
  id INTEGER PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES legal_documents(id),
  term TEXT NOT NULL,
  term_en TEXT,
  definition TEXT NOT NULL,
  source_provision TEXT,
  UNIQUE(document_id, term)
);

CREATE VIRTUAL TABLE definitions_fts USING fts5(
  term, definition,
  content='definitions',
  content_rowid='id',
  tokenize='unicode61'
);

CREATE TRIGGER definitions_ai AFTER INSERT ON definitions BEGIN
  INSERT INTO definitions_fts(rowid, term, definition)
  VALUES (new.id, new.term, new.definition);
END;

CREATE TRIGGER definitions_ad AFTER DELETE ON definitions BEGIN
  INSERT INTO definitions_fts(definitions_fts, rowid, term, definition)
  VALUES ('delete', old.id, old.term, old.definition);
END;

CREATE TABLE IF NOT EXISTS eu_documents (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('directive', 'regulation')),
  year INTEGER NOT NULL,
  number INTEGER NOT NULL,
  community TEXT CHECK(community IN ('EU', 'EG', 'EEG', 'Euratom')),
  celex_number TEXT,
  title TEXT,
  title_no TEXT,
  short_name TEXT,
  adoption_date TEXT,
  entry_into_force_date TEXT,
  in_force BOOLEAN DEFAULT 1,
  amended_by TEXT,
  repeals TEXT,
  url_eur_lex TEXT,
  description TEXT,
  last_updated TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS eu_references (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_type TEXT NOT NULL CHECK(source_type IN ('provision', 'document', 'case_law')),
  source_id TEXT NOT NULL,
  document_id TEXT NOT NULL REFERENCES legal_documents(id),
  provision_id INTEGER REFERENCES legal_provisions(id),
  eu_document_id TEXT NOT NULL REFERENCES eu_documents(id),
  eu_article TEXT,
  reference_type TEXT NOT NULL CHECK(reference_type IN (
    'implements', 'supplements', 'applies', 'references', 'complies_with',
    'derogates_from', 'amended_by', 'repealed_by', 'cites_article'
  )),
  reference_context TEXT,
  full_citation TEXT,
  is_primary_implementation BOOLEAN DEFAULT 0,
  implementation_status TEXT CHECK(implementation_status IN ('complete', 'partial', 'pending', 'unknown')),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  last_verified TEXT,
  UNIQUE(source_id, eu_document_id, eu_article)
);

CREATE INDEX IF NOT EXISTS idx_eu_references_document ON eu_references(document_id, eu_document_id);
CREATE INDEX IF NOT EXISTS idx_eu_references_eu_document ON eu_references(eu_document_id, document_id);
CREATE INDEX IF NOT EXISTS idx_eu_references_provision ON eu_references(provision_id, eu_document_id);
`;

const SAMPLE_DOCUMENTS = [
  { id: 'LOV-2018-06-15-38', type: 'statute', title: 'Lov om behandling av personopplysninger (personopplysningsloven)', title_en: 'Act relating to the processing of personal data (the Personal Data Act)', short_name: 'popplyl', status: 'in_force', issued_date: '2018-06-15', in_force_date: '2018-07-20', url: 'https://lovdata.no/lov/2018-06-15-38', description: 'Gjennomfører personvernforordningen (GDPR) i norsk rett' },
  { id: 'LOV-2000-04-14-31', type: 'statute', title: 'Lov om behandling av personopplysninger (personopplysningsloven)', title_en: 'Personal Data Act', short_name: 'popplyl-2000', status: 'repealed', issued_date: '2000-04-14', in_force_date: '2001-01-01', url: null, description: 'Opphevet 2018-07-20 ved LOV-2018-06-15-38' },
  { id: 'Prop.56 L (2017-2018)', type: 'bill', title: 'Lov om behandling av personopplysninger', title_en: 'Personal Data Processing Act', short_name: null, status: 'in_force', issued_date: '2018-03-23', in_force_date: null, url: null, description: 'Proposisjon om ny personopplysningslov' },
  { id: 'NOU 2009:1', type: 'sou', title: 'Individ og integritet - Personvern i det digitale samfunnet', title_en: null, short_name: null, status: 'in_force', issued_date: '2009-01-29', in_force_date: null, url: null, description: 'Utredning om personvern i det digitale samfunnet' },
  { id: 'HR-2020-1234-A', type: 'case_law', title: 'HR-2020-1234-A', title_en: null, short_name: null, status: 'in_force', issued_date: '2020-03-15', in_force_date: null, url: null, description: 'Høyesteretts avgjørelse om behandling av personopplysninger' },
  { id: 'LA-2019-5678', type: 'case_law', title: 'LA-2019-5678', title_en: null, short_name: null, status: 'in_force', issued_date: '2019-06-20', in_force_date: null, url: null, description: 'Lagmannsrettens avgjørelse om tilsyn etter personopplysningsloven' },
];

const SAMPLE_PROVISIONS = [
  { document_id: 'LOV-2018-06-15-38', provision_ref: '1:1', chapter: '1', section: '1', title: 'Lovens formål', content: 'Formålet med loven er å beskytte den enkelte mot at personvernet blir krenket gjennom behandling av personopplysninger. Loven skal bidra til at personopplysninger blir behandlet i samsvar med personvernforordningen, herunder behovet for personlig integritet og privatlivets fred.' },
  { document_id: 'LOV-2018-06-15-38', provision_ref: '1:2', chapter: '1', section: '2', title: 'Lovens virkeområde', content: 'Loven gjelder for behandling av personopplysninger som helt eller delvis skjer med elektroniske hjelpemidler og for annen behandling av personopplysninger som inngår i eller skal inngå i et personregister.' },
  { document_id: 'LOV-2018-06-15-38', provision_ref: '1:3', chapter: '1', section: '3', title: null, content: 'Loven gjelder ikke for behandling av personopplysninger som en fysisk person foretar som ledd i rent personlige eller familiemessige aktiviteter.' },
  { document_id: 'LOV-2018-06-15-38', provision_ref: '2:1', chapter: '2', section: '1', title: 'Rettslig grunnlag for behandling av personopplysninger', content: 'Personopplysninger kan behandles med hjemmel i artikkel 6 nr. 1 bokstav e i personvernforordningen, når behandlingen er nødvendig for å utføre en oppgave i allmennhetens interesse.' },
  { document_id: 'LOV-2018-06-15-38', provision_ref: '2:2', chapter: '2', section: '2', title: 'Behandling av særlige kategorier av personopplysninger', content: 'Personopplysninger som nevnt i artikkel 9 nr. 1 i personvernforordningen (særlige kategorier av personopplysninger) kan behandles av en offentlig myndighet med hjemmel i artikkel 9 nr. 2 bokstav g i forordningen forutsatt at behandlingen er nødvendig av hensyn til viktige allmenne interesser.' },
  { document_id: 'LOV-2018-06-15-38', provision_ref: '3:1', chapter: '3', section: '1', title: 'Tilsynsmyndighet', content: 'Datatilsynet er tilsynsmyndighet etter personvernforordningen.' },
  { document_id: 'LOV-2018-06-15-38', provision_ref: '3:2', chapter: '3', section: '2', title: 'Overtredelsesgebyr', content: 'Datatilsynet kan ilegge overtredelsesgebyr i samsvar med artiklene 83 og 84 i personvernforordningen.' },
  { document_id: 'LOV-2018-06-15-38', provision_ref: '4:1', chapter: '4', section: '1', title: 'Erstatning', content: 'Den behandlingsansvarlige eller databehandleren skal erstatte den registrerte for skade og krenkelse av den personlige integriteten som en behandling i strid med denne loven har forårsaket.' },
  { document_id: 'LOV-2000-04-14-31', provision_ref: '1', chapter: null, section: '1', title: 'Lovens formål', content: 'Formålet med denne loven er å beskytte den enkelte mot at personvernet blir krenket gjennom behandling av personopplysninger.' },
  { document_id: 'LOV-2000-04-14-31', provision_ref: '3', chapter: null, section: '3', title: 'Definisjoner', content: 'I denne loven forstås med personopplysninger: opplysninger og vurderinger som kan knyttes til en enkeltperson.' },
  { document_id: 'LOV-2000-04-14-31', provision_ref: '5 a', chapter: null, section: '5 a', title: 'Unntak for visse behandlinger', content: 'Behandling av personopplysninger som ikke inngår i eller er ment å inngå i et personregister som er strukturert for å lette søk etter eller sammenstilling av personopplysninger, er tillatt så lenge behandlingen ikke innebærer en krenkelse av den registrertes personvern.' },
];

const SAMPLE_PROVISION_VERSIONS = [
  { document_id: 'LOV-2018-06-15-38', provision_ref: '1:1', chapter: '1', section: '1', title: 'Lovens formål', content: 'Formålet med loven er å beskytte den enkelte mot at personvernet blir krenket gjennom behandling av personopplysninger. Loven skal bidra til at personopplysninger blir behandlet i samsvar med personvernforordningen, herunder behovet for personlig integritet og privatlivets fred.', valid_from: '2018-07-20', valid_to: null },
  { document_id: 'LOV-2018-06-15-38', provision_ref: '1:2', chapter: '1', section: '2', title: 'Lovens virkeområde', content: 'Loven gjelder for behandling av personopplysninger som helt eller delvis skjer med elektroniske hjelpemidler og for annen behandling av personopplysninger som inngår i eller skal inngå i et personregister.', valid_from: '2018-07-20', valid_to: null },
  { document_id: 'LOV-2018-06-15-38', provision_ref: '1:3', chapter: '1', section: '3', title: null, content: 'Loven gjelder ikke for behandling av personopplysninger som en fysisk person foretar som ledd i rent personlige eller familiemessige aktiviteter.', valid_from: '2018-07-20', valid_to: null },
  { document_id: 'LOV-2018-06-15-38', provision_ref: '2:1', chapter: '2', section: '1', title: 'Rettslig grunnlag for behandling av personopplysninger', content: 'Personopplysninger kan behandles med hjemmel i artikkel 6 nr. 1 bokstav e i personvernforordningen, når behandlingen er nødvendig for å utføre en oppgave i allmennhetens interesse.', valid_from: '2018-07-20', valid_to: null },
  { document_id: 'LOV-2018-06-15-38', provision_ref: '2:2', chapter: '2', section: '2', title: 'Behandling av særlige kategorier av personopplysninger', content: 'Personopplysninger som nevnt i artikkel 9 nr. 1 i personvernforordningen (særlige kategorier av personopplysninger) kan behandles av en offentlig myndighet med hjemmel i artikkel 9 nr. 2 bokstav g i forordningen forutsatt at behandlingen er nødvendig av hensyn til viktige allmenne interesser.', valid_from: '2018-07-20', valid_to: null },
  { document_id: 'LOV-2018-06-15-38', provision_ref: '3:1', chapter: '3', section: '1', title: 'Tilsynsmyndighet', content: 'Datatilsynet fører tilsyn med at personvernforordningen overholdes.', valid_from: '2018-07-20', valid_to: '2021-01-01' },
  { document_id: 'LOV-2018-06-15-38', provision_ref: '3:1', chapter: '3', section: '1', title: 'Tilsynsmyndighet', content: 'Datatilsynet er tilsynsmyndighet etter personvernforordningen.', valid_from: '2021-01-01', valid_to: null },
  { document_id: 'LOV-2018-06-15-38', provision_ref: '3:2', chapter: '3', section: '2', title: 'Overtredelsesgebyr', content: 'Datatilsynet kan ilegge overtredelsesgebyr i samsvar med artiklene 83 og 84 i personvernforordningen.', valid_from: '2018-07-20', valid_to: null },
  { document_id: 'LOV-2018-06-15-38', provision_ref: '4:1', chapter: '4', section: '1', title: 'Erstatning', content: 'Den behandlingsansvarlige eller databehandleren skal erstatte den registrerte for skade og krenkelse av den personlige integriteten som en behandling i strid med denne loven har forårsaket.', valid_from: '2018-07-20', valid_to: null },
  { document_id: 'LOV-2000-04-14-31', provision_ref: '1', chapter: null, section: '1', title: 'Lovens formål', content: 'Formålet med denne loven er å beskytte den enkelte mot at personvernet blir krenket gjennom behandling av personopplysninger.', valid_from: '2001-01-01', valid_to: '2018-07-20' },
  { document_id: 'LOV-2000-04-14-31', provision_ref: '3', chapter: null, section: '3', title: 'Definisjoner', content: 'I denne loven forstås med personopplysninger: opplysninger og vurderinger som kan knyttes til en enkeltperson.', valid_from: '2001-01-01', valid_to: '2018-07-20' },
  { document_id: 'LOV-2000-04-14-31', provision_ref: '5 a', chapter: null, section: '5 a', title: 'Unntak for visse behandlinger', content: 'Behandling av personopplysninger som ikke inngår i eller er ment å inngå i et personregister som er strukturert for å lette søk etter eller sammenstilling av personopplysninger, er tillatt så lenge behandlingen ikke innebærer en krenkelse av den registrertes personvern.', valid_from: '2001-01-01', valid_to: '2018-07-20' },
];

const SAMPLE_CASE_LAW = [
  { document_id: 'HR-2020-1234-A', court: 'HR', case_number: '20-012345SIV-HRET', decision_date: '2020-03-15', summary: 'Høyesterett behandlet spørsmålet om erstatning ved ulovlig behandling av personopplysninger. Domstolen fant at den registrerte hadde rett til erstatning for den krenkelsen som behandlingen innebar.', keywords: 'personopplysninger erstatning krenkelse personvern GDPR' },
  { document_id: 'LA-2019-5678', court: 'LA', case_number: '19-056789ASD-BORG/04', decision_date: '2019-06-20', summary: 'Lagmannsretten stadfestet Datatilsynets vedtak om overtredelsesgebyr for manglende behandling av særlige kategorier av personopplysninger innen helsesektoren.', keywords: 'tilsyn overtredelsesgebyr særlige kategorier personopplysninger helse' },
];

const SAMPLE_PREPARATORY_WORKS = [
  { statute_id: 'LOV-2018-06-15-38', prep_document_id: 'Prop.56 L (2017-2018)', title: 'Lov om behandling av personopplysninger', summary: 'Proposisjonen foreslår en ny lov om behandling av personopplysninger som gjennomfører EUs personvernforordning. Loven erstatter personopplysningsloven av 2000 (LOV-2000-04-14-31).' },
  { statute_id: 'LOV-2018-06-15-38', prep_document_id: 'NOU 2009:1', title: 'Individ og integritet', summary: 'Utredningen foreslår tiltak for å styrke personvernet i det digitale samfunnet, med fokus på tilpasning av norsk rett til EUs personvernregelverk.' },
];

const SAMPLE_DEFINITIONS = [
  { document_id: 'LOV-2018-06-15-38', term: 'personopplysning', term_en: 'personal data', definition: 'Enhver opplysning om en identifisert eller identifiserbar fysisk person.', source_provision: '1:1' },
  { document_id: 'LOV-2018-06-15-38', term: 'behandling', term_en: 'processing', definition: 'Enhver operasjon eller rekke av operasjoner som gjøres med personopplysninger.', source_provision: '1:1' },
  { document_id: 'LOV-2018-06-15-38', term: 'behandlingsansvarlig', term_en: 'controller', definition: 'En fysisk eller juridisk person som bestemmer formålet med behandlingen av personopplysninger og hvilke midler som skal benyttes.', source_provision: '1:1' },
  { document_id: 'LOV-2018-06-15-38', term: 'tilsynsmyndighet', term_en: 'supervisory authority', definition: 'Datatilsynet er tilsynsmyndighet.', source_provision: '3:1' },
  { document_id: 'LOV-2000-04-14-31', term: 'personopplysning', term_en: 'personal data', definition: 'Opplysninger og vurderinger som kan knyttes til en enkeltperson.', source_provision: '3' },
];

const SAMPLE_CROSS_REFS = [
  { source_document_id: 'LOV-2018-06-15-38', source_provision_ref: '1:1', target_document_id: 'LOV-2000-04-14-31', target_provision_ref: null, ref_type: 'amended_by' },
  { source_document_id: 'LOV-2018-06-15-38', source_provision_ref: '3:2', target_document_id: 'LOV-2018-06-15-38', target_provision_ref: '3:1', ref_type: 'references' },
  { source_document_id: 'HR-2020-1234-A', source_provision_ref: null, target_document_id: 'LOV-2018-06-15-38', target_provision_ref: '4:1', ref_type: 'references' },
];

const SAMPLE_EU_DOCUMENTS = [
  {
    id: 'regulation:2016/679',
    type: 'regulation',
    year: 2016,
    number: 679,
    community: 'EU',
    celex_number: '32016R0679',
    title: 'Regulation (EU) 2016/679 on the protection of natural persons with regard to the processing of personal data',
    title_no: 'Europaparlaments- og rådsforordning (EU) 2016/679 om vern av fysiske personer i forbindelse med behandling av personopplysninger',
    short_name: 'GDPR',
    adoption_date: '2016-04-27',
    entry_into_force_date: '2018-05-25',
    in_force: 1,
    url_eur_lex: 'https://eur-lex.europa.eu/eli/reg/2016/679/oj',
    description: 'General Data Protection Regulation',
  },
  {
    id: 'directive:95/46',
    type: 'directive',
    year: 1995,
    number: 46,
    community: 'EG',
    celex_number: '31995L0046',
    title: 'Directive 95/46/EC on the protection of individuals with regard to the processing of personal data',
    title_no: 'Direktiv 95/46/EF om vern av fysiske personer i forbindelse med behandling av personopplysninger',
    short_name: 'Data Protection Directive',
    adoption_date: '1995-10-24',
    entry_into_force_date: '1995-10-24',
    in_force: 0, // Repealed by GDPR
    amended_by: '["regulation:2016/679"]',
    url_eur_lex: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:31995L0046',
    description: 'Repealed by GDPR on 2018-05-25',
  },
];

const SAMPLE_EU_REFERENCES = [
  // personopplysningsloven (LOV-2018-06-15-38) supplements GDPR
  {
    source_type: 'document',
    source_id: 'LOV-2018-06-15-38',
    document_id: 'LOV-2018-06-15-38',
    provision_id: null,
    eu_document_id: 'regulation:2016/679',
    eu_article: null,
    reference_type: 'supplements',
    full_citation: 'GDPR (EU) 2016/679',
    is_primary_implementation: 1,
    implementation_status: 'complete',
  },
  // personopplysningsloven 2:1 references GDPR Article 6.1.e
  {
    source_type: 'provision',
    source_id: 'LOV-2018-06-15-38:2:1',
    document_id: 'LOV-2018-06-15-38',
    provision_id: 4, // provision_ref 2:1
    eu_document_id: 'regulation:2016/679',
    eu_article: '6.1.e',
    reference_type: 'cites_article',
    full_citation: 'GDPR Article 6.1.e',
    is_primary_implementation: 0,
  },
  // personopplysningsloven 2:2 references GDPR Article 9.2.g
  {
    source_type: 'provision',
    source_id: 'LOV-2018-06-15-38:2:2',
    document_id: 'LOV-2018-06-15-38',
    provision_id: 5, // provision_ref 2:2
    eu_document_id: 'regulation:2016/679',
    eu_article: '9.2.g',
    reference_type: 'cites_article',
    full_citation: 'GDPR Article 9.2.g',
    is_primary_implementation: 0,
  },
  // personopplysningsloven 3:2 references GDPR Articles 83-84
  {
    source_type: 'provision',
    source_id: 'LOV-2018-06-15-38:3:2',
    document_id: 'LOV-2018-06-15-38',
    provision_id: 7, // provision_ref 3:2
    eu_document_id: 'regulation:2016/679',
    eu_article: '83,84',
    reference_type: 'cites_article',
    full_citation: 'GDPR Articles 83 and 84',
    is_primary_implementation: 0,
  },
  // Old personopplysningsloven (LOV-2000-04-14-31) implemented Data Protection Directive (now repealed)
  {
    source_type: 'document',
    source_id: 'LOV-2000-04-14-31',
    document_id: 'LOV-2000-04-14-31',
    provision_id: null,
    eu_document_id: 'directive:95/46',
    eu_article: null,
    reference_type: 'implements',
    full_citation: 'Directive 95/46/EC',
    is_primary_implementation: 1,
    implementation_status: 'complete',
  },
];

export function createTestDatabase(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  db.exec(SCHEMA);
  insertSampleData(db);
  return db;
}

export function closeTestDatabase(db: Database.Database): void {
  if (db) db.close();
}

function insertSampleData(db: Database.Database): void {
  const insertDoc = db.prepare(`INSERT INTO legal_documents (id, type, title, title_en, short_name, status, issued_date, in_force_date, url, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  for (const doc of SAMPLE_DOCUMENTS) {
    insertDoc.run(doc.id, doc.type, doc.title, doc.title_en, doc.short_name, doc.status, doc.issued_date, doc.in_force_date, doc.url, doc.description);
  }

  const insertProv = db.prepare(`INSERT INTO legal_provisions (document_id, provision_ref, chapter, section, title, content) VALUES (?, ?, ?, ?, ?, ?)`);
  for (const prov of SAMPLE_PROVISIONS) {
    insertProv.run(prov.document_id, prov.provision_ref, prov.chapter, prov.section, prov.title, prov.content);
  }

  const insertProvVersion = db.prepare(`
    INSERT INTO legal_provision_versions (
      document_id, provision_ref, chapter, section, title, content, valid_from, valid_to
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const version of SAMPLE_PROVISION_VERSIONS) {
    insertProvVersion.run(
      version.document_id,
      version.provision_ref,
      version.chapter,
      version.section,
      version.title,
      version.content,
      version.valid_from,
      version.valid_to
    );
  }

  const insertCL = db.prepare(`INSERT INTO case_law (document_id, court, case_number, decision_date, summary, keywords) VALUES (?, ?, ?, ?, ?, ?)`);
  for (const cl of SAMPLE_CASE_LAW) {
    insertCL.run(cl.document_id, cl.court, cl.case_number, cl.decision_date, cl.summary, cl.keywords);
  }

  const insertPW = db.prepare(`INSERT INTO preparatory_works (statute_id, prep_document_id, title, summary) VALUES (?, ?, ?, ?)`);
  for (const pw of SAMPLE_PREPARATORY_WORKS) {
    insertPW.run(pw.statute_id, pw.prep_document_id, pw.title, pw.summary);
  }

  const insertDef = db.prepare(`INSERT INTO definitions (document_id, term, term_en, definition, source_provision) VALUES (?, ?, ?, ?, ?)`);
  for (const def of SAMPLE_DEFINITIONS) {
    insertDef.run(def.document_id, def.term, def.term_en, def.definition, def.source_provision);
  }

  const insertXRef = db.prepare(`INSERT INTO cross_references (source_document_id, source_provision_ref, target_document_id, target_provision_ref, ref_type) VALUES (?, ?, ?, ?, ?)`);
  for (const xref of SAMPLE_CROSS_REFS) {
    insertXRef.run(xref.source_document_id, xref.source_provision_ref, xref.target_document_id, xref.target_provision_ref, xref.ref_type);
  }

  const insertEUDoc = db.prepare(`
    INSERT INTO eu_documents (
      id, type, year, number, community, celex_number, title, title_no, short_name,
      adoption_date, entry_into_force_date, in_force, amended_by, url_eur_lex, description
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const euDoc of SAMPLE_EU_DOCUMENTS) {
    insertEUDoc.run(
      euDoc.id,
      euDoc.type,
      euDoc.year,
      euDoc.number,
      euDoc.community,
      euDoc.celex_number,
      euDoc.title,
      euDoc.title_no,
      euDoc.short_name,
      euDoc.adoption_date,
      euDoc.entry_into_force_date,
      euDoc.in_force,
      euDoc.amended_by || null,
      euDoc.url_eur_lex,
      euDoc.description
    );
  }

  const insertEURef = db.prepare(`
    INSERT INTO eu_references (
      source_type, source_id, document_id, provision_id, eu_document_id, eu_article,
      reference_type, full_citation, is_primary_implementation, implementation_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const euRef of SAMPLE_EU_REFERENCES) {
    insertEURef.run(
      euRef.source_type,
      euRef.source_id,
      euRef.document_id,
      euRef.provision_id,
      euRef.eu_document_id,
      euRef.eu_article,
      euRef.reference_type,
      euRef.full_citation,
      euRef.is_primary_implementation,
      euRef.implementation_status || null
    );
  }
}

export const sampleData = {
  documents: SAMPLE_DOCUMENTS,
  provisions: SAMPLE_PROVISIONS,
  provisionVersions: SAMPLE_PROVISION_VERSIONS,
  caseLaw: SAMPLE_CASE_LAW,
  preparatoryWorks: SAMPLE_PREPARATORY_WORKS,
  definitions: SAMPLE_DEFINITIONS,
  crossRefs: SAMPLE_CROSS_REFS,
  euDocuments: SAMPLE_EU_DOCUMENTS,
  euReferences: SAMPLE_EU_REFERENCES,
};
