/**
 * build_legal_stance — Aggregate citations from multiple sources for a legal question.
 *
 * Searches across statutes, case law, and preparatory works to build
 * a comprehensive set of citations relevant to a legal topic.
 */
import type { Database } from '@ansvar/mcp-sqlite';
import { type ToolResponse } from '../utils/metadata.js';
export interface BuildLegalStanceInput {
    query: string;
    document_id?: string;
    include_case_law?: boolean;
    include_preparatory_works?: boolean;
    as_of_date?: string;
    limit?: number;
}
interface ProvisionHit {
    document_id: string;
    document_title: string;
    provision_ref: string;
    title: string | null;
    snippet: string;
    relevance: number;
}
interface CaseLawHit {
    document_id: string;
    title: string;
    court: string;
    decision_date: string | null;
    summary_snippet: string;
    relevance: number;
}
interface PrepWorkHit {
    statute_id: string;
    prep_document_id: string;
    title: string | null;
    summary_snippet: string;
    relevance: number;
}
export interface LegalStanceResult {
    query: string;
    provisions: ProvisionHit[];
    case_law: CaseLawHit[];
    preparatory_works: PrepWorkHit[];
    total_citations: number;
    as_of_date?: string;
}
export declare function buildLegalStance(db: Database, input: BuildLegalStanceInput): Promise<ToolResponse<LegalStanceResult>>;
export {};
//# sourceMappingURL=build-legal-stance.d.ts.map