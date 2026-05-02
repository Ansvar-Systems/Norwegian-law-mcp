/**
 * search_case_law — Full-text search across Norwegian court decisions.
 *
 * v0.1 STATUS: data-source-unavailable.
 *
 * Norwegian case law (Høyesterett, Lagmannsrett, etc.) is the authoritative
 * corpus, but the only complete machine-readable source is Lovdata, whose
 * api.lovdata.no interface requires a commercial data agreement. That ingestion
 * path is queued for Phase 2 but not yet signed or configured.
 *
 * Per the Ansvar No Silent Fallbacks rule, this tool returns a structured
 * not-available response rather than silently returning empty results or
 * searching a table that contains no Norwegian data.
 *
 * The SQL query infrastructure below is retained for when the api.lovdata.no
 * ingestion path is activated.
 */

import type { Database } from '@ansvar/mcp-sqlite';
import { generateResponseMetadata, type ToolResponse } from '../utils/metadata.js';

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
}

export async function searchCaseLaw(
  db: Database,
  _input: SearchCaseLawInput
): Promise<ToolResponse<CaseLawResult[]>> {
  return {
    results: [],
    _meta: {
      ...generateResponseMetadata(db),
      note: 'data-source-unavailable: Norwegian case law (Høyesterett, Lagmannsrett) is not ingested in this MCP server v0.1. A sanctioned api.lovdata.no ingestion path is planned for Phase 2 but not yet configured. Use the Ansvar Intelligence Portal for Norwegian case law research.',
    },
  };
}
