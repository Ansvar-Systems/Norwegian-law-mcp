/**
 * search_case_law — Full-text search across Norwegian court decisions.
 */
import { buildFtsQueryVariantsLegacy as buildFtsQueryVariants } from '../utils/fts-query.js';
import { generateResponseMetadata } from '../utils/metadata.js';
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;
export async function searchCaseLaw(db, input) {
    if (!input.query || input.query.trim().length === 0) {
        return {
            results: [],
            _metadata: generateResponseMetadata(db)
        };
    }
    const limit = Math.min(Math.max(input.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
    const queryVariants = buildFtsQueryVariants(input.query);
    let sql = `
    SELECT
      cl.document_id,
      ld.title,
      cl.court,
      cl.case_number,
      cl.decision_date,
      snippet(case_law_fts, 0, '>>>', '<<<', '...', 32) as summary_snippet,
      cl.keywords,
      bm25(case_law_fts) as relevance
    FROM case_law_fts
    JOIN case_law cl ON cl.id = case_law_fts.rowid
    JOIN legal_documents ld ON ld.id = cl.document_id
    WHERE case_law_fts MATCH ?
  `;
    const params = [];
    if (input.court) {
        sql += ` AND cl.court = ?`;
        params.push(input.court);
    }
    if (input.date_from) {
        sql += ` AND cl.decision_date >= ?`;
        params.push(input.date_from);
    }
    if (input.date_to) {
        sql += ` AND cl.decision_date <= ?`;
        params.push(input.date_to);
    }
    sql += ` ORDER BY relevance LIMIT ?`;
    params.push(limit);
    const runQuery = (ftsQuery) => {
        const bound = [ftsQuery, ...params];
        const results = db.prepare(sql).all(...bound);
        // Add attribution metadata to each result
        return results.map(result => ({
            ...result,
            _metadata: {
                source: 'lovdata.no',
                attribution: 'Case-law handling is licensing-policy gated; verify rights in LEGAL_DATA_LICENSE.md',
            },
        }));
    };
    const primaryResults = runQuery(queryVariants.primary);
    const results = (primaryResults.length > 0 || !queryVariants.fallback)
        ? primaryResults
        : runQuery(queryVariants.fallback);
    return {
        results,
        _metadata: generateResponseMetadata(db)
    };
}
//# sourceMappingURL=search-case-law.js.map