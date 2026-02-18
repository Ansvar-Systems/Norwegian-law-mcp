/**
 * EU Reference Parser
 *
 * Extracts and structures EU law references (directives and regulations)
 * from Norwegian legal text.
 *
 * Norwegian law references EU legislation using patterns like:
 * - "direktiv 2016/680", "direktiv (EU) 2019/1152"
 * - "forordning (EU) 2016/679", "forordning (EF) nr. 765/2008"
 * - "Europaparlaments- og rådsdirektiv", "Kommisjonens forordning"
 */

export interface EUReference {
  type: 'directive' | 'regulation';
  id: string;                    // Format: "2016/679"
  year: number;
  number: number;
  community?: 'EU' | 'EF' | 'EØF' | 'Euratom';
  issuingBody?: string;          // "Europaparlamentet og Rådet", "Kommisjonen", etc.
  article?: string;              // Specific article reference (e.g., "6.1.c", "13-15")
  fullText: string;              // Full citation as found in text
  context: string;               // Surrounding text (100 chars before/after)
  referenceType?: ReferenceType; // How the EU act is referenced
  implementationKeyword?: string; // "gjennomføring", "utfylling", etc.
}

export type ReferenceType =
  | 'implements'        // National law implements this EU directive
  | 'supplements'       // National law supplements this EU regulation
  | 'applies'           // This EU regulation applies directly
  | 'references'        // General reference to EU law
  | 'complies_with'     // National law must comply with this
  | 'derogates_from'    // National law derogates from this
  | 'cites_article';    // Cites specific article(s)

/**
 * Regex patterns for matching EU references in Norwegian text
 */
const PATTERNS = {
  // Directives: direktiv 2016/680, direktiv 95/46/EF, direktiv (EU) 2019/1152
  directive: [
    // With community designation in parentheses: direktiv (EU) 2016/680
    /direktiv\s+\(([^)]+)\)\s+(\d{2,4})\/(\d+)/gi,
    // With community at end: direktiv 95/46/EF
    /direktiv\s+(\d{2,4})\/(\d+)(?:\/([A-ZÆØÅ]+))?/gi,
    // With issuing body (Norwegian)
    /(Europaparlaments-\s*og\s+råds|rådets?|[Kk]ommisjonens?)(?:direktiv|[\s-]+direktiv)\s+(?:\(([^)]+)\)\s+)?(\d{2,4})\/(\d+)(?:\/([A-ZÆØÅ]+))?/gi,
  ],

  // Regulations: forordning (EU) 2016/679, forordning (EF) nr 765/2008
  regulation: [
    // With community and optional "nr": forordning (EU) nr 2016/679
    /forordning\s+\(([^)]+)\)\s+(?:nr\.?\s+)?(\d{2,4})\/(\d+)/gi,
    // With issuing body (Norwegian)
    /(Europaparlaments-\s*og\s+råds|rådets?|[Kk]ommisjonens?(?:\s+gjennomføringsforordning|\s+delegerte\s+forordning)?)\s+\(([^)]+)\)\s+(?:nr\.?\s+)?(\d{2,4})\/(\d+)/gi,
  ],

  // Article references: artikkel 6.1.c, artiklene 13-15
  article: [
    /artikkel\s+([\d.]+(?:\s*,\s*[\d.]+)*(?:\s+og\s+[\d.]+)?)/gi,
    /artiklene\s+([\d\s-]+(?:,\s*[\d\s-]+)*(?:\s+og\s+[\d\s-]+)?)/gi,
  ],
};

/**
 * Implementation keywords that indicate reference type (Norwegian)
 */
const IMPLEMENTATION_KEYWORDS: Record<string, ReferenceType> = {
  'gjennomføring': 'implements',
  'gjennomfører': 'implements',
  'gjennomføre': 'implements',
  'utfyller': 'supplements',
  'utfylling': 'supplements',
  'utfyllende': 'supplements',
  'anvendelse': 'applies',
  'anvendes': 'applies',
  'i samsvar med': 'complies_with',
  'i overensstemmelse med': 'complies_with',
  'med hjemmel i': 'cites_article',
  'i henhold til': 'cites_article',
  'i medhold av': 'cites_article',
};

/**
 * Extract all EU references from Norwegian legal text
 */
export function extractEUReferences(text: string): EUReference[] {
  const references: EUReference[] = [];
  const seen = new Set<string>();

  // Extract directives
  for (const pattern of PATTERNS.directive) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const ref = parseDirectiveMatch(match, text);
      if (ref && !seen.has(ref.id + ':' + ref.community)) {
        seen.add(ref.id + ':' + ref.community);
        references.push(ref);
      }
    }
  }

  // Extract regulations
  for (const pattern of PATTERNS.regulation) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const ref = parseRegulationMatch(match, text);
      if (ref && !seen.has(ref.id + ':' + ref.community)) {
        seen.add(ref.id + ':' + ref.community);
        references.push(ref);
      }
    }
  }

  // Enhance references with article citations and context
  return references.map(ref => enhanceReference(ref, text));
}

/**
 * Parse a directive regex match
 */
function parseDirectiveMatch(match: RegExpMatchArray, text: string): EUReference | null {
  const fullText = match[0];
  const index = match.index || 0;

  let year: number;
  let number: number;
  let community: 'EU' | 'EF' | 'EØF' | 'Euratom' | undefined;
  let issuingBody: string | undefined;

  // Check if first capture group looks like issuing body
  if (match[1] && match[1].match(/råd|kommisjon|Europa/i)) {
    issuingBody = match[1];
    community = parseCommunity(match[2] || 'EU');
    year = parseInt(match[3]);
    number = parseInt(match[4]);
  } else if (match[1] && !match[1].match(/^\d/) && match[2] && match[3]) {
    community = parseCommunity(match[1]);
    year = parseInt(match[2]);
    number = parseInt(match[3]);
  } else if (match[1] && match[1].match(/^\d/) && match[2]) {
    year = parseInt(match[1]);
    number = parseInt(match[2]);
    community = match[3] ? parseCommunity(match[3]) : 'EU';
  } else {
    return null;
  }

  if (isNaN(year) || isNaN(number)) return null;

  // Normalize 2-digit years to 4-digit
  if (year < 100) {
    year = year < 50 ? 2000 + year : 1900 + year;
  }

  const id = `${year}/${number}`;
  const context = extractContext(text, index, fullText.length);

  return {
    type: 'directive',
    id,
    year,
    number,
    community,
    issuingBody,
    fullText,
    context,
  };
}

/**
 * Parse a regulation regex match
 */
function parseRegulationMatch(match: RegExpMatchArray, text: string): EUReference | null {
  const fullText = match[0];
  const index = match.index || 0;

  let year: number;
  let number: number;
  let community: 'EU' | 'EF' | 'EØF' | 'Euratom' | undefined;
  let issuingBody: string | undefined;

  // Check if we have an issuing body
  if (match[1] && match[1].match(/råd|kommisjon|Europa/i)) {
    issuingBody = match[1];
    community = parseCommunity(match[2] || 'EU');
    year = parseInt(match[3]);
    number = parseInt(match[4]);
  } else if (match[1] && match[2] && match[3]) {
    community = parseCommunity(match[1]);
    year = parseInt(match[2]);
    number = parseInt(match[3]);
  } else {
    return null;
  }

  if (isNaN(year) || isNaN(number)) return null;

  // Normalize 2-digit years
  if (year < 100) {
    year = year < 50 ? 2000 + year : 1900 + year;
  }

  const id = `${year}/${number}`;
  const context = extractContext(text, index, fullText.length);

  return {
    type: 'regulation',
    id,
    year,
    number,
    community,
    issuingBody,
    fullText,
    context,
  };
}

/**
 * Parse community designation (EU, EF, EØF, Euratom)
 * Norwegian uses EF (not EG) and EØF (not EEG)
 */
function parseCommunity(text: string): 'EU' | 'EF' | 'EØF' | 'Euratom' {
  const normalized = text.toUpperCase().trim();
  if (normalized.includes('EURATOM')) return 'Euratom';
  if (normalized.includes('EØF')) return 'EØF';
  if (normalized.includes('EF') && !normalized.includes('EU')) return 'EF';
  // Also handle Swedish EG/EEG for backward compat with existing data
  if (normalized === 'EG') return 'EF';
  if (normalized === 'EEG') return 'EØF';
  return 'EU';
}

/**
 * Extract context around a match (100 chars before/after)
 */
function extractContext(text: string, index: number, matchLength: number): string {
  const start = Math.max(0, index - 100);
  const end = Math.min(text.length, index + matchLength + 100);
  return text.substring(start, end).replace(/\s+/g, ' ').trim();
}

/**
 * Enhance reference with article citations and implementation keywords
 */
function enhanceReference(ref: EUReference, _text: string): EUReference {
  // Look for article references near this EU reference
  const contextWindow = ref.context;
  const articleMatches = contextWindow.match(/artikkel\s+([\d.]+(?:\s*,\s*[\d.]+)*(?:\s+og\s+[\d.]+)?)/i);
  if (articleMatches) {
    ref.article = articleMatches[1].trim();
    ref.referenceType = 'cites_article';
  }

  // Check for implementation keywords (Norwegian)
  const lowerContext = contextWindow.toLowerCase();
  for (const [keyword, refType] of Object.entries(IMPLEMENTATION_KEYWORDS)) {
    if (lowerContext.includes(keyword)) {
      ref.implementationKeyword = keyword;
      if (!ref.referenceType) {
        ref.referenceType = refType;
      }
      break;
    }
  }

  // Default reference type if not determined
  if (!ref.referenceType) {
    ref.referenceType = ref.type === 'directive' ? 'implements' : 'applies';
  }

  return ref;
}

/**
 * Generate database-compatible ID for EU document
 * Format: "directive:2016/679" or "regulation:2016/679"
 */
export function generateEUDocumentId(ref: EUReference): string {
  return `${ref.type}:${ref.id}`;
}

/**
 * Parse EU document ID back to components
 */
export function parseEUDocumentId(id: string): { type: 'directive' | 'regulation'; year: number; number: number } | null {
  const match = id.match(/^(directive|regulation):(\d{4})\/(\d+)$/);
  if (!match) return null;

  return {
    type: match[1] as 'directive' | 'regulation',
    year: parseInt(match[2]),
    number: parseInt(match[3]),
  };
}

/**
 * Format EU reference for display (Norwegian)
 */
export function formatEUReference(ref: EUReference, format: 'short' | 'full' = 'short'): string {
  if (format === 'short') {
    const community = ref.community || 'EU';
    const typeLabel = ref.type === 'directive' ? 'direktiv' : 'forordning';
    return `${typeLabel} (${community}) ${ref.id}`;
  }

  // Full format with issuing body
  let result = '';
  if (ref.issuingBody) {
    result += ref.issuingBody + ' ';
  }
  result += ref.type === 'directive' ? 'direktiv ' : 'forordning ';
  result += `(${ref.community || 'EU'}) ${ref.id}`;

  if (ref.article) {
    result += `, artikkel ${ref.article}`;
  }

  return result;
}

/**
 * Get CELEX number for EU document (standard EU document identifier)
 * Format: 3YYYYXNNNNN where:
 * - 3 = third sector (EU legislation)
 * - YYYY = year
 * - X = type (L=directive, R=regulation)
 * - NNNNN = sequential number (zero-padded)
 */
export function generateCELEXNumber(ref: EUReference): string {
  const year = ref.year;
  const typeCode = ref.type === 'directive' ? 'L' : 'R';
  const number = ref.number.toString().padStart(4, '0');
  return `3${year}${typeCode}${number}`;
}
