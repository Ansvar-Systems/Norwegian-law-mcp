/**
 * Parse Norwegian legal citation strings into structured objects.
 *
 * Primary formats (Norwegian):
 *   - LOV-2018-06-15-38 [kapittel X] [§ Y]
 *   - FOR-2018-09-14-1324 [kapittel X] [§ Y]
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
/**
 * Parse a legal citation string (Norwegian LOV primary, legacy SFS supported).
 */
export declare function parseCitation(citation: string): ParsedCitation;
/**
 * Detect the document type from a citation string without full parsing.
 */
export declare function detectDocumentType(citation: string): DocumentType | null;
//# sourceMappingURL=parser.d.ts.map