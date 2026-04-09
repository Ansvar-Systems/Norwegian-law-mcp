/**
 * FTS5 query helpers for Norwegian Law MCP.
 *
 * Handles query sanitization, boolean operator passthrough, stemming,
 * and 6-tier variant generation for SQLite FTS5.
 */
/**
 * Naive English stemmer: strips a common suffix and returns `stem*`.
 * Returns null if the word is too short (<5 chars) or no suffix matched.
 */
export declare function stemWord(word: string): string | null;
/**
 * Sanitize user input for safe FTS5 queries.
 *
 * Removes characters that have special meaning in FTS5 syntax while
 * preserving AND, OR, NOT as boolean operators when they appear
 * between search terms.
 */
export declare function sanitizeFtsInput(input: string): string;
/**
 * Build FTS5 query variants for a search term.
 *
 * When boolean operators (AND/OR/NOT) are detected, returns only the
 * sanitized input as a single variant — let FTS5 handle the boolean logic.
 *
 * Otherwise returns variants in specificity order (most specific first):
 * 1. Exact phrase match — `"term1 term2 term3"`
 * 2. AND — `term1 AND term2 AND term3`
 * 3. Prefix AND — `term1 AND term2 AND term3*`
 * 4. Stemmed prefix — `stem1* AND stem2* AND stem3*`
 * 5. OR — `term1 OR term2 OR term3`
 */
export declare function buildFtsQueryVariants(sanitized: string): string[];
/**
 * Build a SQL LIKE pattern from search terms.
 *
 * Produces `%term1%term2%...%` for use as a last-resort fallback
 * when all FTS5 variants return zero results.
 */
export interface FtsQueryVariants {
    primary: string;
    fallback?: string;
    use_like?: boolean;
}
export declare function buildFtsQueryVariantsLegacy(query: string): FtsQueryVariants;
export declare function buildLikePattern(input: string): string;
//# sourceMappingURL=fts-query.d.ts.map