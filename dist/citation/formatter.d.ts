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
export declare function formatCitation(citation: ParsedCitation, format?: CitationFormat): string;
/**
 * Format a provision reference string from chapter and section.
 * Returns e.g. "3:5" for chapter 3 section 5, or just "5" for flat statutes.
 */
export declare function formatProvisionRef(chapter: string | undefined, section: string): string;
//# sourceMappingURL=formatter.d.ts.map