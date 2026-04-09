/**
 * validate_citation — Validate a Norwegian legal citation against the database.
 *
 * Zero-hallucination enforcer: checks that the cited document and provision
 * actually exist in the database.
 */
import type { Database } from '@ansvar/mcp-sqlite';
import { type ToolResponse } from '../utils/metadata.js';
export interface ValidateCitationInput {
    citation: string;
}
export interface ValidateCitationResult {
    citation: string;
    formatted_citation: string;
    valid: boolean;
    document_exists: boolean;
    provision_exists: boolean;
    document_title?: string;
    status?: string;
    warnings: string[];
}
export declare function validateCitationTool(db: Database, input: ValidateCitationInput): Promise<ToolResponse<ValidateCitationResult>>;
//# sourceMappingURL=validate-citation.d.ts.map