/**
 * search_eu_implementations — Search for EU directives/regulations by keyword.
 */
import type { Database } from '@ansvar/mcp-sqlite';
import { type ToolResponse } from '../utils/metadata.js';
export interface SearchEUImplementationsInput {
    query?: string;
    type?: 'directive' | 'regulation';
    year_from?: number;
    year_to?: number;
    community?: 'EU' | 'EG' | 'EEG' | 'Euratom';
    has_norwegian_implementation?: boolean;
    limit?: number;
}
export interface SearchEUImplementationsResult {
    results: Array<{
        eu_document: {
            id: string;
            type: 'directive' | 'regulation';
            year: number;
            number: number;
            title?: string;
            short_name?: string;
            community: string;
            celex_number?: string;
        };
        statute_count: number;
        primary_implementations: string[];
        all_references: string[];
    }>;
    total_results: number;
    query_info: SearchEUImplementationsInput;
}
/**
 * Search for EU directives/regulations with implementation information.
 *
 * Supports filtering by type, year range, community, and keyword search.
 */
export declare function searchEUImplementations(db: Database, input: SearchEUImplementationsInput): Promise<ToolResponse<SearchEUImplementationsResult>>;
//# sourceMappingURL=search-eu-implementations.d.ts.map