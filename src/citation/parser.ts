/**
 * Parse Norwegian legal citation strings into structured objects.
 *
 * Primary formats (Norwegian):
 *   - LOV-2018-06-15-38 [kapittel X] [§ Y]
 *   - HR-2020-1234-A, LA-2019-5678, Rt. 2015 s. 1250
 *   - Prop.56 L (2017-2018), Ot.prp. nr. 44 (2001-2002)
 *   - NOU 2009:1
 *
 * Legacy formats (Swedish, backward compat):
 *   - SFS 2018:218 [3 kap.] [5 §]
 *   - Prop. 2017/18:105
 *   - SOU 2023:45, Ds 2022:10
 *   - NJA 2020 s. 45, HFD 2019 ref. 12
 */

import type { ParsedCitation, DocumentType } from '../types/index.js';

/** Norwegian LOV pattern: LOV-2018-06-15-38 [kapittel X] [§ Y] */
const LOV_PATTERN = /^(?:LOV\s+)?(LOV-\d{4}-\d{2}-\d{2}(?:-[a-z0-9]+)?)\s*(?:(?:kapittel|kap\.?)\s+(\d+)\s*)?(?:§\s*(\d+\s*[a-z]?))?\s*$/i;

/** Norwegian case law: HR-2020-1234-A, LA-2019-5678, LB-2020-12345 */
const CASE_HR_PATTERN = /^(HR|LA|LB|LE|TING)-(\d{4})-(\d+)(?:-([A-Z]))?$/i;

/** Historical Norwegian case law: Rt. 2015 s. 1250 */
const CASE_RT_PATTERN = /^(Rt)\.\s*(\d{4})\s+s\.\s*(\d+)/i;

/** Norwegian proposition: Prop.56 L (2017-2018), Ot.prp. nr. 44 (2001-2002) */
const PROP_NO_PATTERN = /^(?:Prop\.?\s*(\d+)\s*(?:L|LS|S)\s*\((\d{4}-\d{4})\))|(?:Ot\.prp\.?\s*(?:nr\.?\s*)?(\d+)\s*\((\d{4}-\d{4})\))/i;

/** NOU pattern: NOU 2009:1 */
const NOU_PATTERN = /^NOU\s+(\d{4}:\d+)/i;

/** Legacy Swedish proposition: Prop. 2017/18:105 */
const PROP_SE_PATTERN = /^Prop\.\s*(\d{4}\/\d{2}:\d+)/i;

/** Legacy SOU: SOU 2023:45 */
const SOU_PATTERN = /^SOU\s+(\d{4}:\d+)/i;

/** Legacy Ds: Ds 2022:10 */
const DS_PATTERN = /^Ds\s+(\d{4}:\d+)/i;

/** Legacy Swedish case law: NJA 2020 s. 45 */
const CASE_NJA_PATTERN = /^(NJA)\s+(\d{4})\s+s\.\s*(\d+)/i;
/** Legacy: HFD 2019 ref. 12 */
const CASE_HFD_PATTERN = /^(HFD)\s+(\d{4})\s+ref\.\s*(\d+)/i;
/** Legacy: AD 2021 nr 5 */
const CASE_GENERIC_PATTERN = /^(AD|MD|MIG)\s+(\d{4})\s+(?:nr|ref\.?)\s*(\d+)/i;

/** Legacy SFS pattern: SFS 2018:218 [3 kap.] [5 §] */
const SFS_PATTERN = /^(?:SFS\s+)?(\d{4}:\d+)\s*(?:(\d+)\s*kap\.\s*)?(?:(\d+\s*[a-z]?)\s*§)?/i;
/** Legacy short form: 2018:218 3:5 */
const SFS_SHORT_PATTERN = /^(?:SFS\s+)?(\d{4}:\d+)\s+(\d+):(\d+\s*[a-z]?)\s*$/i;

/**
 * Parse a legal citation string (Norwegian LOV primary, legacy SFS supported).
 */
export function parseCitation(citation: string): ParsedCitation {
  const trimmed = citation.trim();

  if (!trimmed) {
    return { raw: citation, type: 'statute', document_id: '', valid: false, error: 'Empty citation' };
  }

  // 1. Norwegian LOV format (primary)
  const lovMatch = trimmed.match(LOV_PATTERN);
  if (lovMatch && lovMatch[1]) {
    const result: ParsedCitation = {
      raw: citation,
      type: 'statute',
      document_id: lovMatch[1].toUpperCase(),
      valid: true,
    };
    if (lovMatch[2]) result.chapter = lovMatch[2];
    if (lovMatch[3]) result.section = lovMatch[3].replace(/\s+/g, ' ').trim();
    return result;
  }

  // 2. Norwegian case law: HR-2020-1234-A
  const hrMatch = trimmed.match(CASE_HR_PATTERN);
  if (hrMatch) {
    return {
      raw: citation,
      type: 'case_law',
      document_id: `${hrMatch[1].toUpperCase()}-${hrMatch[2]}-${hrMatch[3]}${hrMatch[4] ? `-${hrMatch[4].toUpperCase()}` : ''}`,
      valid: true,
    };
  }

  // 3. Historical case law: Rt. 2015 s. 1250
  const rtMatch = trimmed.match(CASE_RT_PATTERN);
  if (rtMatch) {
    return {
      raw: citation,
      type: 'case_law',
      document_id: `Rt. ${rtMatch[2]}`,
      page: rtMatch[3],
      valid: true,
    };
  }

  // 4. Norwegian proposition: Prop.56 L (2017-2018)
  const propNoMatch = trimmed.match(PROP_NO_PATTERN);
  if (propNoMatch) {
    const propNum = propNoMatch[1] || propNoMatch[3];
    const session = propNoMatch[2] || propNoMatch[4];
    return {
      raw: citation,
      type: 'bill',
      document_id: `Prop.${propNum} (${session})`,
      valid: true,
    };
  }

  // 5. NOU
  const nouMatch = trimmed.match(NOU_PATTERN);
  if (nouMatch) {
    return { raw: citation, type: 'sou', document_id: nouMatch[1], valid: true };
  }

  // 6. Legacy Swedish proposition: Prop. 2017/18:105
  const propSeMatch = trimmed.match(PROP_SE_PATTERN);
  if (propSeMatch) {
    return { raw: citation, type: 'bill', document_id: propSeMatch[1], valid: true };
  }

  // 7. Legacy SOU
  const souMatch = trimmed.match(SOU_PATTERN);
  if (souMatch) {
    return { raw: citation, type: 'sou', document_id: souMatch[1], valid: true };
  }

  // 8. Legacy Ds
  const dsMatch = trimmed.match(DS_PATTERN);
  if (dsMatch) {
    return { raw: citation, type: 'ds', document_id: dsMatch[1], valid: true };
  }

  // 9. Legacy Swedish case law: NJA, HFD, AD, etc.
  for (const pattern of [CASE_NJA_PATTERN, CASE_HFD_PATTERN, CASE_GENERIC_PATTERN]) {
    const caseMatch = trimmed.match(pattern);
    if (caseMatch) {
      return {
        raw: citation,
        type: 'case_law',
        document_id: `${caseMatch[1].toUpperCase()} ${caseMatch[2]}`,
        page: caseMatch[3],
        valid: true,
      };
    }
  }

  // 10. Legacy SFS short form: 2018:218 3:5
  const sfsShortMatch = trimmed.match(SFS_SHORT_PATTERN);
  if (sfsShortMatch && sfsShortMatch[1]) {
    return {
      raw: citation,
      type: 'statute',
      document_id: sfsShortMatch[1],
      chapter: sfsShortMatch[2],
      section: sfsShortMatch[3].replace(/\s+/g, ' ').trim(),
      valid: true,
    };
  }

  // 11. Legacy SFS long form: SFS 2018:218 3 kap. 5 §
  const sfsMatch = trimmed.match(SFS_PATTERN);
  if (sfsMatch && sfsMatch[1]) {
    const result: ParsedCitation = {
      raw: citation,
      type: 'statute',
      document_id: sfsMatch[1],
      valid: true,
    };
    if (sfsMatch[2]) result.chapter = sfsMatch[2];
    if (sfsMatch[3]) result.section = sfsMatch[3].replace(/\s+/g, ' ').trim();
    return result;
  }

  return {
    raw: citation,
    type: 'statute',
    document_id: '',
    valid: false,
    error: `Unrecognized citation format: "${trimmed}"`,
  };
}

/**
 * Detect the document type from a citation string without full parsing.
 */
export function detectDocumentType(citation: string): DocumentType | null {
  const trimmed = citation.trim();
  // Norwegian LOV
  if (/^(?:lov\s+)?lov-\d{4}-\d{2}-\d{2}(?:-[a-z0-9]+)?/i.test(trimmed)) return 'statute';
  // Norwegian case law
  if (/^(?:hr|la|lb|le|ting)-\d{4}-/i.test(trimmed)) return 'case_law';
  if (/^rt\.\s*\d{4}/i.test(trimmed)) return 'case_law';
  // Proposition (Norwegian and Swedish)
  if (/^(?:prop\.?|ot\.prp\.?)/i.test(trimmed)) return 'bill';
  // NOU
  if (/^nou\s/i.test(trimmed)) return 'sou';
  // Legacy Swedish
  if (/^sou\s/i.test(trimmed)) return 'sou';
  if (/^ds\s/i.test(trimmed)) return 'ds';
  if (/^(nja|hfd|ad|md|mig)\s/i.test(trimmed)) return 'case_law';
  if (/^(?:sfs\s+)?\d{4}:\d+/i.test(trimmed)) return 'statute';
  return null;
}
