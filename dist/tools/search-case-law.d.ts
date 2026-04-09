/**
 * search_case_law — Full-text search across Norwegian court decisions.
 */
import type { Database } from '@ansvar/mcp-sqlite';
import { type ToolResponse } from '../utils/metadata.js';
export interface SearchCaseLawInput {
    query: string;
    court?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
}
export interface CaseLawResult {
    document_id: string;
    title: string;
    court: string;
    case_number: string | null;
    decision_date: string | null;
    summary_snippet: string;
    keywords: string | null;
    relevance: number;
    _metadata: {
        source: string;
        attribution: string;
    };
}
export declare function searchCaseLaw(db: Database, input: SearchCaseLawInput): Promise<ToolResponse<CaseLawResult[]>>;
//# sourceMappingURL=search-case-law.d.ts.map