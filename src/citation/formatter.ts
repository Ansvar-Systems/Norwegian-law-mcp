/**
 * Format Norwegian legal citations per standard conventions.
 *
 * Supports both Norwegian LOV format and legacy Swedish SFS format.
 */

import type { ParsedCitation, CitationFormat } from '../types/index.js';

/**
 * Format a parsed citation into a standard citation string.
 *
 * Norwegian LOV:
 *   - full:     "LOV LOV-2018-06-15-38 kapittel 3 § 5"
 *   - short:    "LOV-2018-06-15-38 3:5"
 *   - pinpoint: "kapittel 3 § 5"
 *
 * Legacy SFS:
 *   - full:     "SFS 2018:218 3 kap. 5 §"
 *   - short:    "2018:218 3:5"
 *   - pinpoint: "3 kap. 5 §"
 */
export function formatCitation(citation: ParsedCitation, format: CitationFormat = 'full'): string {
  if (!citation.valid) {
    return citation.raw;
  }

  switch (citation.type) {
    case 'statute':
      return formatStatute(citation, format);
    case 'bill':
      return formatBill(citation);
    case 'sou':
      return `NOU ${citation.document_id}`;
    case 'ds':
      return `Ds ${citation.document_id}`;
    case 'case_law':
      return formatCaseLaw(citation);
    default:
      return citation.raw;
  }
}

function isNorwegianLov(documentId: string): boolean {
  return /^LOV-\d{4}-\d{2}-\d{2}(?:-[A-Za-z0-9]+)?$/i.test(documentId);
}

function formatStatute(citation: ParsedCitation, format: CitationFormat): string {
  const { document_id, chapter, section } = citation;
  const isLov = isNorwegianLov(document_id);
  const chapterLabel = isLov ? 'kapittel' : 'kap.';

  if (format === 'pinpoint') {
    if (chapter && section) return isLov ? `kapittel ${chapter} § ${section}` : `${chapter} kap. ${section} §`;
    if (section) return `${section} §`;
    return document_id;
  }

  if (format === 'short') {
    if (chapter && section) return `${document_id} ${chapter}:${section}`;
    if (section) return isLov ? `${document_id} § ${section}` : `${document_id} ${section} §`;
    return document_id;
  }

  // full format
  let result = isLov ? `LOV ${document_id}` : `SFS ${document_id}`;
  if (chapter) result += isLov ? ` ${chapterLabel} ${chapter}` : ` ${chapter} ${chapterLabel}`;
  if (section) result += ` ${section} §`;
  return result;
}

function formatBill(citation: ParsedCitation): string {
  // If it looks like a Norwegian proposition ID (contains parentheses session)
  if (citation.document_id.includes('(')) {
    return citation.document_id;
  }
  // Legacy Swedish: Prop. 2017/18:105
  return `Prop. ${citation.document_id}`;
}

function formatCaseLaw(citation: ParsedCitation): string {
  const parts = [citation.document_id];

  // NJA (Swedish Supreme Court) uses "s." connector
  if (citation.document_id.startsWith('NJA')) {
    if (citation.page) parts.push(`s. ${citation.page}`);
  } else if (citation.document_id.startsWith('Rt.')) {
    // Norwegian historical: Rt. 2015 s. 1250
    if (citation.page) parts.push(`s. ${citation.page}`);
  } else if (citation.document_id.startsWith('HFD')) {
    // Swedish HFD uses "ref."
    if (citation.page) parts.push(`ref. ${citation.page}`);
  } else {
    // Norwegian modern: HR-2020-1234-A avsnitt X
    if (citation.page) parts.push(`avsnitt ${citation.page}`);
  }

  return parts.join(' ');
}

/**
 * Format a provision reference string from chapter and section.
 * Returns e.g. "3:5" for chapter 3 section 5, or just "5" for flat statutes.
 */
export function formatProvisionRef(chapter: string | undefined, section: string): string {
  if (chapter) {
    return `${chapter}:${section}`;
  }
  return section;
}
