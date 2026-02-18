/**
 * Parse amendment references from Norwegian statute text.
 *
 * Norwegian statutes indicate amendments using standard phrases:
 *   - "Endret ved lov DD. måned YYYY nr. NN" or "Endret ved lov DD mmm YYYY nr NN"
 *   - "Tilføyd ved lov DD. måned YYYY nr. NN"
 *   - "Opphevet ved lov DD. måned YYYY nr. NN"
 *   - LOV-YYYY-MM-DD-NN references
 *
 * Example:
 *   "Endret ved lov 20 juni 2014 nr. 49."
 *   → Amendment by LOV-2014-06-20-49
 */

export interface AmendmentReference {
  /** LOV id of amending statute, e.g., "LOV-2014-06-20-49" */
  amended_by_lov: string;

  /** Type of amendment */
  amendment_type: 'endret' | 'tilføyd' | 'opphevet' | 'ikrafttredelse';

  /** Position in text where reference was found */
  position: 'suffix' | 'inline' | 'transition';

  /** Raw text fragment containing the reference */
  raw_text: string;
}

export interface ProvisionAmendment {
  /** Target provision reference, e.g., "§ 5" */
  provision_ref: string;

  /** Amendment references found in this provision */
  amendments: AmendmentReference[];
}

/** LOV reference pattern: LOV-YYYY-MM-DD-NN */
const LOV_PATTERN = /(LOV-\d{4}-\d{2}-\d{2}-\d+)/gu;

/** Amended: "Endret ved lov DD mmm YYYY nr. NN" or "Endret ved lov LOV-..." */
const AMENDED_PATTERN = /[Ee]ndret\s+ved\s+lov\s+((?:\d{1,2}\s*\.?\s*[a-zæøå]+\s+\d{4}\s+nr\.?\s*\d+)|(?:LOV-\d{4}-\d{2}-\d{2}-\d+))/gu;

/** Added: "Tilføyd ved lov ..." */
const ADDED_PATTERN = /[Tt]ilf[øo]yd\s+ved\s+lov\s+((?:\d{1,2}\s*\.?\s*[a-zæøå]+\s+\d{4}\s+nr\.?\s*\d+)|(?:LOV-\d{4}-\d{2}-\d{2}-\d+))/gu;

/** Repealed: "Opphevet ved lov ..." */
const REPEALED_PATTERN = /[Oo]pphevet\s+ved\s+lov\s+((?:\d{1,2}\s*\.?\s*[a-zæøå]+\s+\d{4}\s+nr\.?\s*\d+)|(?:LOV-\d{4}-\d{2}-\d{2}-\d+))/gu;

/** Force of law: "Trer i kraft" or "Ikrafttredelse" */
const FORCE_PATTERN = /[Tt]rer\s+i\s+kraft|[Ii]krafttredelse/u;

/** Norwegian month names for date parsing */
const MONTH_NAMES: Record<string, string> = {
  'januar': '01', 'februar': '02', 'mars': '03', 'april': '04',
  'mai': '05', 'juni': '06', 'juli': '07', 'august': '08',
  'september': '09', 'oktober': '10', 'november': '11', 'desember': '12',
  // Abbreviated forms
  'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
  'jun': '06', 'jul': '07', 'aug': '08', 'sep': '09',
  'okt': '10', 'nov': '11', 'des': '12',
};

/**
 * Parse a Norwegian date + nr reference into a LOV id.
 * E.g., "20 juni 2014 nr. 49" → "LOV-2014-06-20-49"
 * Or return the LOV id directly if already in LOV format.
 */
function parseLovReference(ref: string): string | null {
  // Already a LOV id
  if (/^LOV-\d{4}-\d{2}-\d{2}-\d+$/.test(ref)) {
    return ref;
  }

  // Parse "DD mmm YYYY nr NN" format
  const match = ref.match(/(\d{1,2})\s*\.?\s*([a-zæøå]+)\s+(\d{4})\s+nr\.?\s*(\d+)/i);
  if (!match) return null;

  const day = match[1].padStart(2, '0');
  const monthName = match[2].toLowerCase();
  const month = MONTH_NAMES[monthName];
  const year = match[3];
  const nr = match[4];

  if (!month) return null;

  return `LOV-${year}-${month}-${day}-${nr}`;
}

/**
 * Extract amendment references from provision text.
 *
 * Priority order:
 * 1. Explicit amendment patterns (Endret, Tilføyd, Opphevet)
 * 2. Direct LOV references
 * 3. Entry-into-force references in transitional provisions
 */
export function extractAmendmentReferences(content: string): AmendmentReference[] {
  const amendments: AmendmentReference[] = [];
  const seenLovIds = new Set<string>();

  // 1. Check for "Endret ved lov" (amended)
  for (const match of content.matchAll(AMENDED_PATTERN)) {
    const lovId = parseLovReference(match[1]);
    if (lovId && !seenLovIds.has(lovId)) {
      seenLovIds.add(lovId);
      amendments.push({
        amended_by_lov: lovId,
        amendment_type: 'endret',
        position: 'inline',
        raw_text: match[0],
      });
    }
  }

  // 2. Check for "Tilføyd ved lov" (added)
  for (const match of content.matchAll(ADDED_PATTERN)) {
    const lovId = parseLovReference(match[1]);
    if (lovId && !seenLovIds.has(lovId)) {
      seenLovIds.add(lovId);
      amendments.push({
        amended_by_lov: lovId,
        amendment_type: 'tilføyd',
        position: 'inline',
        raw_text: match[0],
      });
    }
  }

  // 3. Check for "Opphevet ved lov" (repealed)
  for (const match of content.matchAll(REPEALED_PATTERN)) {
    const lovId = parseLovReference(match[1]);
    if (lovId && !seenLovIds.has(lovId)) {
      seenLovIds.add(lovId);
      amendments.push({
        amended_by_lov: lovId,
        amendment_type: 'opphevet',
        position: 'inline',
        raw_text: match[0],
      });
    }
  }

  // 4. If no explicit patterns found, look for standalone LOV references
  if (amendments.length === 0) {
    for (const match of content.matchAll(LOV_PATTERN)) {
      const lovId = match[1];
      if (!seenLovIds.has(lovId)) {
        seenLovIds.add(lovId);
        const isTransition = FORCE_PATTERN.test(content);
        amendments.push({
          amended_by_lov: lovId,
          amendment_type: isTransition ? 'ikrafttredelse' : 'endret',
          position: isTransition ? 'transition' : 'suffix',
          raw_text: match[0],
        });
      }
    }
  }

  return amendments;
}

/**
 * Parse amendment references from all provisions in a statute.
 */
export function parseStatuteAmendments(
  provisions: Array<{ provision_ref: string; content: string }>
): ProvisionAmendment[] {
  const results: ProvisionAmendment[] = [];

  for (const provision of provisions) {
    const amendments = extractAmendmentReferences(provision.content);

    if (amendments.length > 0) {
      results.push({
        provision_ref: provision.provision_ref,
        amendments,
      });
    }
  }

  return results;
}

export interface StatuteMetadataAmendments {
  /** LOV id of statute that repealed this one, if any */
  repealed_by_lov?: string;

  /** Date this statute was repealed, ISO format */
  repealed_date?: string;

  /** Free-text description of repeal */
  repeal_description?: string;

  /** LOV ids mentioned in document metadata */
  referenced_lovs: string[];
}

/**
 * Extract amendment metadata from document metadata.
 *
 * Source documents may have metadata like:
 *   Opphevet: 2018-05-25
 *   Opphevet ved lov: LOV-2018-06-15-38
 */
export function extractMetadataAmendments(
  metadata: Record<string, string>
): StatuteMetadataAmendments {
  const result: StatuteMetadataAmendments = {
    referenced_lovs: [],
  };

  // Repeal date
  const repealDate = metadata['Opphevet'];
  if (repealDate) {
    const dateMatch = repealDate.match(/\d{4}-\d{2}-\d{2}/);
    if (dateMatch) {
      result.repealed_date = dateMatch[0];
    }
  }

  // Repealing statute
  const repealedBy = metadata['Opphevet ved lov'] || metadata['Opphevet ved'];
  if (repealedBy) {
    const lovMatch = repealedBy.match(/(LOV-\d{4}-\d{2}-\d{2}-\d+)/);
    if (lovMatch) {
      result.repealed_by_lov = lovMatch[1];
      result.referenced_lovs.push(lovMatch[1]);
    }
    result.repeal_description = repealedBy;
  }

  // Extract all LOV references from all metadata values
  for (const value of Object.values(metadata)) {
    for (const match of value.matchAll(LOV_PATTERN)) {
      if (!result.referenced_lovs.includes(match[1])) {
        result.referenced_lovs.push(match[1]);
      }
    }
  }

  return result;
}

export interface AmendmentSection {
  /** Section number in amending statute, e.g., "§ 1", "§ 2" */
  section_ref: string;

  /** Target statute being amended, e.g., "LOV-2018-06-15-38" */
  target_statute_id: string;

  /** Target statute name */
  target_statute_name?: string;

  /** Target provision being amended, e.g., "§ 5" */
  target_provision_ref?: string;

  /** Type of change */
  change_type: 'endret' | 'tilføyd' | 'opphevet' | 'overgangsbestemmelser';

  /** New text (for endret/tilføyd) */
  new_text?: string;

  /** Description of change */
  description?: string;
}

/**
 * Parse an amending statute document to extract amendment sections.
 *
 * Norwegian amending statutes typically have structure:
 *   I lov DD. måned YYYY nr. NN (lovens korttittel) gjøres følgende endringer:
 *   § X skal lyde:
 *   [new text]
 */
export function parseAmendingStatute(text: string): AmendmentSection[] {
  const sections: AmendmentSection[] = [];

  // Pattern: "I lov ... (LOV-...) gjøres følgende endringer" or "I lov DD mmm YYYY nr NN"
  const amendmentHeaderPattern = /[Ii]\s+lov\s+(.+?)\s*(?:\((LOV-\d{4}-\d{2}-\d{2}-\d+)\))?\s*gjøres\s+følgende\s+endring/gu;

  const matches = Array.from(text.matchAll(amendmentHeaderPattern));

  for (const match of matches) {
    const targetStatuteName = match[1].trim();
    const targetStatuteId = match[2] || parseLovReference(targetStatuteName) || 'unknown';

    // Find the section number that precedes this amendment header
    const headerPos = match.index!;
    const precedingText = text.slice(Math.max(0, headerPos - 100), headerPos);
    const sectionMatch = precedingText.match(/§\s*(\d+)/);

    sections.push({
      section_ref: sectionMatch ? `§ ${sectionMatch[1]}` : 'unknown',
      target_statute_id: targetStatuteId,
      target_statute_name: targetStatuteName,
      change_type: 'endret',
      description: `Endringer i ${targetStatuteName} (${targetStatuteId})`,
    });
  }

  return sections;
}

/**
 * Validate that a LOV id has correct format.
 */
export function isValidLovId(lovId: string): boolean {
  return /^LOV-\d{4}-\d{2}-\d{2}-\d+$/.test(lovId);
}

/**
 * Format LOV id consistently (strip whitespace, normalize).
 */
export function normalizeLovId(lovId: string): string | null {
  const match = lovId.match(/(LOV-\d{4}-\d{2}-\d{2}-\d+)/);
  return match ? match[1] : null;
}

/**
 * Extract effective date from amendment text, if present.
 *
 * Example: "Denne loven trer i kraft 1. juli 2021"
 * Returns: "2021-07-01"
 */
export function extractEffectiveDate(text: string): string | null {
  // Pattern: "trer i kraft [den] DD. month YYYY"
  const pattern = /trer\s+i\s+kraft\s+(?:den\s+)?(\d{1,2})\s*\.?\s*([a-zæøå]+)\s+(\d{4})/iu;
  const match = text.match(pattern);

  if (match) {
    const day = match[1].padStart(2, '0');
    const month = MONTH_NAMES[match[2].toLowerCase()];
    const year = match[3];

    if (month) {
      return `${year}-${month}-${day}`;
    }
  }

  // Fallback: ISO date pattern
  const isoMatch = text.match(/(\d{4}-\d{2}-\d{2})/);
  return isoMatch ? isoMatch[1] : null;
}
