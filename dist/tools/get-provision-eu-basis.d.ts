/**
 * get_provision_eu_basis — Get EU legal basis for a specific provision.
 */
import type { Database } from '@ansvar/mcp-sqlite';
import type { ProvisionEUReference } from '../types/index.js';
import { type ToolResponse } from '../utils/metadata.js';
export interface GetProvisionEUBasisInput {
    law_id: string;
    /** @deprecated Use law_id instead */
    sfs_number?: string;
    provision_ref: string;
}
export interface GetProvisionEUBasisResult {
    law_id: string;
    /** @deprecated Use law_id */
    sfs_number: string;
    provision_ref: string;
    provision_content?: string;
    eu_references: ProvisionEUReference[];
}
/**
 * Get EU legal basis for a specific provision within a Norwegian statute.
 *
 * Returns EU directives/regulations that this specific provision implements or references,
 * including article-level references.
 */
export declare function getProvisionEUBasis(db: Database, input: GetProvisionEUBasisInput): Promise<ToolResponse<GetProvisionEUBasisResult>>;
//# sourceMappingURL=get-provision-eu-basis.d.ts.map