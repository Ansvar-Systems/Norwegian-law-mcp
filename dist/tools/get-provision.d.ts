/**
 * get_provision — Retrieve a specific provision from a Norwegian statute.
 */
import type { Database } from '@ansvar/mcp-sqlite';
import { type ToolResponse } from '../utils/metadata.js';
export interface GetProvisionInput {
    document_id: string;
    chapter?: string;
    section?: string;
    provision_ref?: string;
    as_of_date?: string;
    limit?: number;
}
export interface ProvisionResult {
    document_id: string;
    document_title: string;
    document_status: string;
    provision_ref: string;
    chapter: string | null;
    section: string;
    title: string | null;
    content: string;
    metadata: Record<string, unknown> | null;
    cross_references: CrossRefResult[];
    valid_from?: string | null;
    valid_to?: string | null;
}
interface CrossRefResult {
    target_document_id: string;
    target_provision_ref: string | null;
    ref_type: string;
}
export declare function getProvision(db: Database, input: GetProvisionInput): Promise<ToolResponse<ProvisionResult | ProvisionResult[] | null>>;
export {};
//# sourceMappingURL=get-provision.d.ts.map