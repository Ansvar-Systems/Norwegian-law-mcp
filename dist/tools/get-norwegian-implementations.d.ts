/**
 * EU implementation lookup tool.
 *
 * Finds Norwegian statutes implementing a specific EU directive or regulation.
 */
import type { Database } from '@ansvar/mcp-sqlite';
import type { NorwegianImplementation } from '../types/index.js';
import { type ToolResponse } from '../utils/metadata.js';
export interface GetNorwegianImplementationsInput {
    eu_document_id: string;
    primary_only?: boolean;
    in_force_only?: boolean;
}
export interface GetNorwegianImplementationsResult {
    eu_document: {
        id: string;
        type: 'directive' | 'regulation';
        year: number;
        number: number;
        title?: string;
        short_name?: string;
        celex_number?: string;
    };
    implementations: NorwegianImplementation[];
    statistics: {
        total_statutes: number;
        primary_implementations: number;
        in_force: number;
        repealed: number;
    };
}
/** @deprecated Use GetNorwegianImplementationsInput */
export type GetSwedishImplementationsInput = GetNorwegianImplementationsInput;
/** @deprecated Use GetNorwegianImplementationsResult */
export type GetSwedishImplementationsResult = GetNorwegianImplementationsResult;
/** @deprecated Use getNorwegianImplementations */
export declare function getSwedishImplementations(db: Database, input: GetNorwegianImplementationsInput): Promise<ToolResponse<GetNorwegianImplementationsResult>>;
export declare function getNorwegianImplementations(db: Database, input: GetNorwegianImplementationsInput): Promise<ToolResponse<GetNorwegianImplementationsResult>>;
//# sourceMappingURL=get-norwegian-implementations.d.ts.map