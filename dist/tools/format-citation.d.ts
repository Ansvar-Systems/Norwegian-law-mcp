/**
 * format_citation — Format a Norwegian legal citation per standard conventions.
 */
import type { CitationFormat } from '../types/index.js';
import { type ToolResponse } from '../utils/metadata.js';
export interface FormatCitationInput {
    citation: string;
    format?: CitationFormat;
}
export interface FormatCitationResult {
    input: string;
    formatted: string;
    type: string;
    valid: boolean;
    error?: string;
}
export declare function formatCitationTool(input: FormatCitationInput): Promise<ToolResponse<FormatCitationResult>>;
//# sourceMappingURL=format-citation.d.ts.map