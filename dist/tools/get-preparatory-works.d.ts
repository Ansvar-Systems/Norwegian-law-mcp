/**
 * get_preparatory_works — Retrieve preparatory works (forarbeider) for a statute.
 */
import type { Database } from '@ansvar/mcp-sqlite';
import { type ToolResponse } from '../utils/metadata.js';
export interface GetPreparatoryWorksInput {
    document_id: string;
    limit?: number;
}
export interface PreparatoryWorkResult {
    statute_id: string;
    statute_title: string;
    prep_document_id: string;
    prep_type: string;
    prep_title: string;
    summary: string | null;
    issued_date: string | null;
    url: string | null;
}
export declare function getPreparatoryWorks(db: Database, input: GetPreparatoryWorksInput): Promise<ToolResponse<PreparatoryWorkResult[]>>;
//# sourceMappingURL=get-preparatory-works.d.ts.map