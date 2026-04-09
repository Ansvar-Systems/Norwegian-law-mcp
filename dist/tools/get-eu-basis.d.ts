/**
 * get_eu_basis — Retrieve EU legal basis for a Norwegian statute.
 */
import type { Database } from '@ansvar/mcp-sqlite';
import type { EUBasisDocument } from '../types/index.js';
import { type ToolResponse } from '../utils/metadata.js';
export interface GetEUBasisInput {
    law_id: string;
    /** @deprecated Use law_id instead */
    document_id?: string;
    /** @deprecated Use law_id instead */
    sfs_number?: string;
    include_articles?: boolean;
    reference_types?: string[];
}
export interface GetEUBasisResult {
    law_id: string;
    law_title: string;
    /** @deprecated Use law_id */
    sfs_number: string;
    /** @deprecated Use law_title */
    sfs_title: string;
    eu_documents: EUBasisDocument[];
    statistics: {
        total_eu_references: number;
        directive_count: number;
        regulation_count: number;
    };
}
/**
 * Get EU legal basis for a Norwegian statute.
 *
 * Returns all EU directives and regulations referenced by the given statute,
 * grouped by EU document with all article references aggregated.
 */
export declare function getEUBasis(db: Database, input: GetEUBasisInput): Promise<ToolResponse<GetEUBasisResult>>;
//# sourceMappingURL=get-eu-basis.d.ts.map