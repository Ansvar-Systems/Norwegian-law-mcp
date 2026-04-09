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
/**
 * Extract amendment references from provision text.
 *
 * Priority order:
 * 1. Explicit amendment patterns (Endret, Tilføyd, Opphevet)
 * 2. Direct LOV references
 * 3. Entry-into-force references in transitional provisions
 */
export declare function extractAmendmentReferences(content: string): AmendmentReference[];
/**
 * Parse amendment references from all provisions in a statute.
 */
export declare function parseStatuteAmendments(provisions: Array<{
    provision_ref: string;
    content: string;
}>): ProvisionAmendment[];
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
export declare function extractMetadataAmendments(metadata: Record<string, string>): StatuteMetadataAmendments;
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
export declare function parseAmendingStatute(text: string): AmendmentSection[];
/**
 * Validate that a LOV id has correct format.
 */
export declare function isValidLovId(lovId: string): boolean;
/**
 * Format LOV id consistently (strip whitespace, normalize).
 */
export declare function normalizeLovId(lovId: string): string | null;
/**
 * Extract effective date from amendment text, if present.
 *
 * Example: "Denne loven trer i kraft 1. juli 2021"
 * Returns: "2021-07-01"
 */
export declare function extractEffectiveDate(text: string): string | null;
//# sourceMappingURL=amendment-parser.d.ts.map