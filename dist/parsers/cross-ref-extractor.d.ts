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
/**
 * Extract cross-references from provision text.
 *
 * @param text - Provision content text
 * @returns Array of extracted references
 */
export declare function extractCrossReferences(text: string): ExtractedRef[];
//# sourceMappingURL=cross-ref-extractor.d.ts.map