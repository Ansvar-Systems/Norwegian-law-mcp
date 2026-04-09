/**
 * list_sources — Return data source provenance for this MCP server.
 */
import type { Database } from '@ansvar/mcp-sqlite';
import { type ToolResponse } from '../utils/metadata.js';
export interface ListSourcesResult {
    mcp_name: string;
    jurisdiction: string;
    sources: Array<{
        name: string;
        authority: string;
        official_portal: string;
        retrieval_method: string;
        update_frequency: string;
        last_ingested: string;
        license: {
            type: string;
            url: string;
            summary: string;
        };
        coverage: {
            scope: string;
            limitations: string;
        };
        languages: string[];
    }>;
    data_freshness: {
        automated_checks: boolean;
        check_frequency: string;
        last_verified: string;
    };
}
export declare function listSources(db: Database): Promise<ToolResponse<ListSourcesResult>>;
//# sourceMappingURL=list-sources.d.ts.map