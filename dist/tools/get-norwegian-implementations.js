/**
 * EU implementation lookup tool.
 *
 * Finds Norwegian statutes implementing a specific EU directive or regulation.
 */
import { generateResponseMetadata } from '../utils/metadata.js';
async function runImplementationLookup(db, input) {
    if (!input.eu_document_id || !/^(directive|regulation):\d+\/\d+$/.test(input.eu_document_id)) {
        throw new Error(`Invalid EU document ID format: "${input.eu_document_id}". Expected format: "directive:YYYY/NNN" or "regulation:YYYY/NNN" (e.g., "regulation:2016/679")`);
    }
    const euDoc = db.prepare(`
    SELECT id, type, year, number, title, short_name, celex_number
    FROM eu_documents
    WHERE id = ?
  `).get(input.eu_document_id);
    if (!euDoc) {
        throw new Error(`EU document ${input.eu_document_id} not found in database`);
    }
    let sql = `
    SELECT
      ld.id AS law_id,
      ld.title AS law_title,
      ld.short_name,
      ld.status,
      er.reference_type,
      er.is_primary_implementation,
      er.implementation_status,
      GROUP_CONCAT(DISTINCT er.eu_article) AS articles_referenced
    FROM legal_documents ld
    JOIN eu_references er ON ld.id = er.document_id
    WHERE er.eu_document_id = ?
  `;
    const params = [input.eu_document_id];
    if (input.primary_only) {
        sql += ` AND er.is_primary_implementation = 1`;
    }
    if (input.in_force_only) {
        sql += ` AND ld.status = 'in_force'`;
    }
    sql += `
    GROUP BY ld.id
    ORDER BY er.is_primary_implementation DESC, ld.id
  `;
    const rows = db.prepare(sql).all(...params);
    const implementations = rows.map(row => {
        const impl = {
            law_id: row.law_id,
            law_title: row.law_title,
            sfs_number: row.law_id,
            sfs_title: row.law_title,
            status: row.status,
            reference_type: row.reference_type,
            is_primary_implementation: row.is_primary_implementation === 1,
        };
        if (row.short_name)
            impl.short_name = row.short_name;
        if (row.implementation_status)
            impl.implementation_status = row.implementation_status;
        if (row.articles_referenced) {
            impl.articles_referenced = row.articles_referenced.split(',').filter(a => a && a.trim());
        }
        return impl;
    });
    const result = {
        eu_document: {
            id: euDoc.id,
            type: euDoc.type,
            year: euDoc.year,
            number: euDoc.number,
            title: euDoc.title,
            short_name: euDoc.short_name,
            celex_number: euDoc.celex_number,
        },
        implementations,
        statistics: {
            total_statutes: implementations.length,
            primary_implementations: implementations.filter(i => i.is_primary_implementation).length,
            in_force: implementations.filter(i => i.status === 'in_force').length,
            repealed: implementations.filter(i => i.status === 'repealed').length,
        },
    };
    return {
        results: result,
        _metadata: generateResponseMetadata(db),
    };
}
/** @deprecated Use getNorwegianImplementations */
export async function getSwedishImplementations(db, input) {
    return runImplementationLookup(db, input);
}
export async function getNorwegianImplementations(db, input) {
    return runImplementationLookup(db, input);
}
//# sourceMappingURL=get-norwegian-implementations.js.map