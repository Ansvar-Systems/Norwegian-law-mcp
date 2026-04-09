/**
 * validate_eu_compliance — Check Norwegian statute's EU compliance status.
 */
import type { Database } from '@ansvar/mcp-sqlite';
import { type ToolResponse } from '../utils/metadata.js';
export interface ValidateEUComplianceInput {
    law_id: string;
    /** @deprecated Use law_id instead */
    sfs_number?: string;
    provision_ref?: string;
    eu_document_id?: string;
}
export interface EUComplianceResult {
    law_id: string;
    /** @deprecated Use law_id */
    sfs_number: string;
    provision_ref?: string;
    compliance_status: 'compliant' | 'partial' | 'unclear' | 'not_applicable';
    eu_references_found: number;
    warnings: string[];
    outdated_references?: Array<{
        eu_document_id: string;
        title?: string;
        issue: string;
        replaced_by?: string;
    }>;
    recommendations?: string[];
}
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
export declare function validateEUCompliance(db: Database, input: ValidateEUComplianceInput): Promise<ToolResponse<EUComplianceResult>>;
//# sourceMappingURL=validate-eu-compliance.d.ts.map