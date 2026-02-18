/**
 * Extract cross-references from Norwegian legal provision text.
 *
 * Detects patterns like:
 *   - "kapittel 3 § 5" (same statute, different provision)
 *   - "LOV-2018-06-15-38" (reference to another statute)
 *   - "(2018:218)" (legacy SFS format, backward compat)
 */

/** An extracted cross-reference */
export interface ExtractedRef {
  /** LOV id if detected */
  target_law_id?: string;
  /** Target provision reference (e.g., "3:5") */
  target_provision_ref?: string;
  /** Raw text of the reference */
  raw_text: string;
}

/** Pattern for LOV-YYYY-MM-DD-NN references */
const LOV_REF_PATTERN = /(LOV-\d{4}-\d{2}-\d{2}-\d+)/g;

/** Pattern for "(yyyy:nnn)" SFS references (backward compat) */
const SFS_REF_PATTERN = /\((\d{4}:\d+)\)/g;

/** Pattern for "X kap. Y §" or "kapittel X § Y" provision references */
const PROVISION_REF_PATTERN = /(\d+)\s*kap\.\s*(\d+\s*[a-z]?)\s*\u00a7/g;

/**
 * Extract cross-references from provision text.
 *
 * @param text - Provision content text
 * @returns Array of extracted references
 */
export function extractCrossReferences(text: string): ExtractedRef[] {
  const refs: ExtractedRef[] = [];
  const seen = new Set<string>();

  // Extract LOV id references: "LOV-2018-06-15-38"
  let match;
  while ((match = LOV_REF_PATTERN.exec(text)) !== null) {
    const key = `lov:${match[1]}`;
    if (!seen.has(key)) {
      seen.add(key);
      refs.push({
        target_law_id: match[1],
        raw_text: match[0],
      });
    }
  }

  // Extract SFS number references (backward compat): "(2018:218)"
  while ((match = SFS_REF_PATTERN.exec(text)) !== null) {
    const key = `sfs:${match[1]}`;
    if (!seen.has(key)) {
      seen.add(key);
      refs.push({
        target_law_id: match[1],
        raw_text: match[0],
      });
    }
  }

  // Extract "X kap. Y §" references
  while ((match = PROVISION_REF_PATTERN.exec(text)) !== null) {
    const chapter = match[1];
    const section = match[2].replace(/\s+/g, ' ').trim();
    const ref = `${chapter}:${section}`;
    const key = `prov:${ref}`;
    if (!seen.has(key)) {
      seen.add(key);
      refs.push({
        target_provision_ref: ref,
        raw_text: match[0],
      });
    }
  }

  return refs;
}
