/**
 * Statute ID resolution for Norwegian Law MCP.
 *
 * 9-step resolution cascade with shortest-match ranking.
 * Resolves fuzzy document references (titles, Act names, chapter numbers)
 * to database document IDs.
 */
import type Database from '@ansvar/mcp-sqlite';
type Db = InstanceType<typeof Database>;
/** Reset caches — exported for test teardown. */
export declare function resetCaches(): void;
/**
 * Resolve a document identifier to a database document ID.
 *
 * Steps:
 * 1. Direct ID match
 * 2. Abbreviation map
 * 3. Chapter number lookup
 * 4. Exact title match (case-insensitive), then with trailing year stripped
 * 5. Shortest LIKE match on title
 * 6. Case-insensitive shortest LIKE on title
 * 7. Short-name LIKE (case-insensitive)
 * 8. Punctuation-normalized full scan (shortest match)
 * 9. Return null
 */
export declare function resolveDocumentId(db: Db, input: string): string | null;
/** @deprecated Use resolveDocumentId instead. */
export declare const resolveExistingStatuteId: typeof resolveDocumentId;
/** @deprecated Use resolveDocumentId(db, id) !== null instead. */
export declare function isValidStatuteId(db: Db, id: string): boolean;
/** @deprecated Return candidate IDs for a query (compat shim). */
export declare function statuteIdCandidates(db: Db, input: string): string[];
export {};
//# sourceMappingURL=statute-id.d.ts.map