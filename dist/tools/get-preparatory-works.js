/**
 * get_preparatory_works — Retrieve preparatory works (forarbeider) for a statute.
 */
import { generateResponseMetadata } from '../utils/metadata.js';
export async function getPreparatoryWorks(db, input) {
    if (!input.document_id) {
        throw new Error('document_id is required');
    }
    const sql = `
    SELECT
      pw.statute_id,
      statute.title as statute_title,
      pw.prep_document_id,
      prep.type as prep_type,
      COALESCE(pw.title, prep.title) as prep_title,
      pw.summary,
      prep.issued_date,
      prep.url
    FROM preparatory_works pw
    JOIN legal_documents statute ON statute.id = pw.statute_id
    JOIN legal_documents prep ON prep.id = pw.prep_document_id
    WHERE pw.statute_id = ?
    ORDER BY prep.issued_date
    LIMIT ?
  `;
    const limit = Math.min(Math.max(input.limit ?? 50, 1), 200);
    const results = db.prepare(sql).all(input.document_id, limit);
    return {
        results,
        _metadata: generateResponseMetadata(db)
    };
}
//# sourceMappingURL=get-preparatory-works.js.map