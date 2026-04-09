/**
 * validate_eu_compliance — Check Norwegian statute's EU compliance status.
 */
import { generateResponseMetadata } from '../utils/metadata.js';
/**
 * Validate EU compliance status for a Norwegian statute or provision.
 *
 * Phase 1: Basic validation checking for:
 * - References to repealed EU directives
 * - Missing implementation status
 * - Outdated references
 *
 * Future phases will include full compliance checking against EU requirements.
 */
export async function validateEUCompliance(db, input) {
    const statuteId = input.law_id ?? input.sfs_number;
    // Validate supported statute identifier format
    if (!statuteId || !/^(?:\d{4}:\d+|LOV-\d{4}-\d{2}-\d{2}-\d+)$/i.test(statuteId)) {
        throw new Error(`Invalid statute identifier format: "${statuteId}". Expected "LOV-YYYY-MM-DD[-NNN]" or legacy "YYYY:NNN".`);
    }
    // Check if statute exists
    const statute = db.prepare(`
    SELECT id, title, status
    FROM legal_documents
    WHERE id = ? AND type = 'statute'
  `).get(statuteId);
    if (!statute) {
        throw new Error(`Statute ${statuteId} not found in database`);
    }
    let provisionId = null;
    if (input.provision_ref) {
        const provision = db.prepare(`
      SELECT id FROM legal_provisions
      WHERE document_id = ? AND provision_ref = ?
    `).get(statuteId, input.provision_ref);
        if (!provision) {
            throw new Error(`Provision ${statuteId} ${input.provision_ref} not found in database`);
        }
        provisionId = provision.id;
    }
    // Get all EU references for this statute/provision
    let sql = `
    SELECT
      ed.id,
      ed.type,
      ed.title,
      ed.in_force,
      ed.amended_by,
      ed.repeals,
      er.reference_type,
      er.is_primary_implementation,
      er.implementation_status
    FROM eu_documents ed
    JOIN eu_references er ON ed.id = er.eu_document_id
    WHERE er.document_id = ?
  `;
    const params = [statuteId];
    // Filter by provision if specified
    if (provisionId !== null) {
        sql += ` AND er.provision_id = ?`;
        params.push(provisionId);
    }
    // Filter by specific EU document if requested
    if (input.eu_document_id) {
        sql += ` AND ed.id = ?`;
        params.push(input.eu_document_id);
    }
    const rows = db.prepare(sql).all(...params);
    const warnings = [];
    const outdatedReferences = [];
    const recommendations = [];
    // Analyze each EU reference
    for (const row of rows) {
        // Check if EU document is no longer in force
        if (row.in_force === 0) {
            const issue = `References repealed EU ${row.type} ${row.id}`;
            warnings.push(issue);
            const outdated = {
                eu_document_id: row.id,
                issue,
            };
            if (row.title)
                outdated.title = row.title;
            // Check if there's a replacement
            if (row.amended_by) {
                try {
                    const replacements = JSON.parse(row.amended_by);
                    if (replacements.length > 0) {
                        outdated.replaced_by = replacements[0];
                        warnings.push(`  → Replaced by ${replacements[0]}`);
                    }
                }
                catch {
                    // Ignore JSON parse errors
                }
            }
            outdatedReferences.push(outdated);
        }
        // Check for missing implementation status
        if (row.is_primary_implementation === 1 && !row.implementation_status) {
            warnings.push(`Primary implementation of ${row.id} lacks implementation_status field`);
            recommendations.push(`Consider updating database with implementation_status for ${row.id}`);
        }
        // Check for unclear implementation status
        if (row.implementation_status === 'unknown' || row.implementation_status === 'pending') {
            warnings.push(`Implementation status for ${row.id} is "${row.implementation_status}"`);
        }
    }
    // Determine overall compliance status
    let complianceStatus;
    if (rows.length === 0) {
        complianceStatus = 'not_applicable';
        recommendations.push('No EU references found for this statute. If this statute implements EU law, consider adding EU references to the database.');
    }
    else if (outdatedReferences.length > 0) {
        complianceStatus = 'partial';
        recommendations.push('Statute references repealed EU directives. Review whether Norwegian law has been updated to implement current EU requirements.');
    }
    else if (warnings.length > 0) {
        complianceStatus = 'unclear';
    }
    else {
        complianceStatus = 'compliant';
    }
    const result = {
        law_id: statuteId,
        sfs_number: statuteId,
        provision_ref: input.provision_ref,
        compliance_status: complianceStatus,
        eu_references_found: rows.length,
        warnings,
    };
    if (outdatedReferences.length > 0) {
        result.outdated_references = outdatedReferences;
    }
    if (recommendations.length > 0) {
        result.recommendations = recommendations;
    }
    return {
        results: result,
        _metadata: generateResponseMetadata(db),
    };
}
//# sourceMappingURL=validate-eu-compliance.js.map