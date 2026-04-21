/**
 * Extract cross-references from Norwegian legal provision text.
 *
 * Detects patterns like:
 *   - "kapittel 3 § 5" (same statute, different provision — LOV form)
 *   - "§ 1-1" (same regulation, different provision — FOR form)
 *   - "LOV-2018-06-15-38" (reference to another statute)
 *   - "FOR-2018-09-14-1324" (reference to another regulation)
 *   - "(2018:218)" (legacy SFS format, backward compat)
 *
 * Note: `target_provision_ref` is emitted in raw form (e.g. "3:5" or "1-1");
 * callers that resolve it against legal_provisions.provision_ref must know
 * the target document type to interpret the format correctly. See
 * `buildProvisionRef` in src/utils/citation.ts for the canonical format rules.
 */

/** An extracted cross-reference */
export interface ExtractedRef {
  /** LOV or FOR id if detected (renamed from target_law_id; old name kept as alias) */
  target_law_id?: string;
  /** Target provision reference (LOV: "3:5"; FOR: "1-1") */
  target_provision_ref?: string;
  /** Raw text of the reference */
  raw_text: string;
}

/** Pattern for LOV-YYYY-MM-DD-NN references */
const LOV_REF_PATTERN = /(LOV-\d{4}-\d{2}-\d{2}-\d+)/g;

/** Pattern for FOR-YYYY-MM-DD-NN references (forskrifter cross-citing each other) */
const FOR_REF_PATTERN = /(FOR-\d{4}-\d{2}-\d{2}-\d+)/g;

/** Pattern for "(yyyy:nnn)" SFS references (backward compat) */
const SFS_REF_PATTERN = /\((\d{4}:\d+)\)/g;

/** Pattern for "X kap. Y §" or "kapittel X § Y" provision references (LOV form) */
const PROVISION_REF_PATTERN = /(\d+)\s*kap\.\s*(\d+\s*[a-z]?)\s*\u00a7/g;

/** Pattern for "§ X-Y" provision references (FOR form — chapter embedded in section) */
const FORSKRIFT_PROVISION_REF_PATTERN = /\u00a7\s*(\d+-\d+[a-z]?)/g;

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

  // Extract FOR id references: "FOR-2018-09-14-1324"
  while ((match = FOR_REF_PATTERN.exec(text)) !== null) {
    const key = `for:${match[1]}`;
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

  // Extract LOV-form "X kap. Y §" provision references — emitted as "X:Y"
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

  // Extract FOR-form "§ X-Y" provision references — section already embeds chapter
  while ((match = FORSKRIFT_PROVISION_REF_PATTERN.exec(text)) !== null) {
    const ref = match[1];
    const key = `prov-for:${ref}`;
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
