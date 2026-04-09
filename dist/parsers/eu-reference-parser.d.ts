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
    id: string;
    year: number;
    number: number;
    community?: 'EU' | 'EF' | 'EØF' | 'Euratom';
    issuingBody?: string;
    article?: string;
    fullText: string;
    context: string;
    referenceType?: ReferenceType;
    implementationKeyword?: string;
}
export type ReferenceType = 'implements' | 'supplements' | 'applies' | 'references' | 'complies_with' | 'derogates_from' | 'cites_article';
/**
 * Extract all EU references from Norwegian legal text
 */
export declare function extractEUReferences(text: string): EUReference[];
/**
 * Generate database-compatible ID for EU document
 * Format: "directive:2016/679" or "regulation:2016/679"
 */
export declare function generateEUDocumentId(ref: EUReference): string;
/**
 * Parse EU document ID back to components
 */
export declare function parseEUDocumentId(id: string): {
    type: 'directive' | 'regulation';
    year: number;
    number: number;
} | null;
/**
 * Format EU reference for display (Norwegian)
 */
export declare function formatEUReference(ref: EUReference, format?: 'short' | 'full'): string;
/**
 * Get CELEX number for EU document (standard EU document identifier)
 * Format: 3YYYYXNNNNN where:
 * - 3 = third sector (EU legislation)
 * - YYYY = year
 * - X = type (L=directive, R=regulation)
 * - NNNNN = sequential number (zero-padded)
 */
export declare function generateCELEXNumber(ref: EUReference): string;
//# sourceMappingURL=eu-reference-parser.d.ts.map