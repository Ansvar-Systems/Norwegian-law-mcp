/**
 * Parse statute text into structured provisions.
 *
 * Detects and handles:
 *   - Chaptered statutes: "3 kap. 5 §" → provision_ref "3:5"
 *   - Flat statutes: "5 §" → provision_ref "5"
 *   - Special numbering: "5 a §" → provision_ref "5 a"
 */
/** Parsed provision from raw statute text */
export interface ParsedProvision {
    provision_ref: string;
    chapter?: string;
    section: string;
    title?: string;
    content: string;
}
/**
 * Parse raw statute text into structured provisions.
 *
 * @param text - Full statute text
 * @returns Array of parsed provisions
 */
export declare function parseStatuteText(text: string): ParsedProvision[];
/**
 * Detect if a statute uses chapters (chaptered) or not (flat).
 */
export declare function isChapteredStatute(text: string): boolean;
//# sourceMappingURL=provision-parser.d.ts.map