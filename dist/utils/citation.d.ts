/**
 * Citation metadata for the deterministic citation pipeline.
 *
 * Provides structured identifiers (canonical_ref, display_text, aliases)
 * that the platform's entity linker uses to match references in agent
 * responses to MCP tool results — without relying on LLM formatting.
 *
 * This is the UNIVERSAL template — works for all MCP types (law, sector,
 * agriculture, domain). Each MCP adapts the builder call to its own
 * field names.
 *
 * See: docs/guides/law-mcp-golden-standard.md Section 4.9c
 */
export interface CitationMetadata {
    canonical_ref: string;
    display_text: string;
    aliases?: string[];
    source_url?: string;
    lookup: {
        tool: string;
        args: Record<string, string>;
    };
}
/**
 * Build citation metadata for any retrieval tool response.
 *
 * @param canonicalRef  Primary reference the entity linker matches against
 *                      (e.g., "SFS 2018:218", "GDPR Article 33", "CVE-2024-1234")
 * @param displayText   How the reference appears in prose
 *                      (e.g., "34 § SFS 2018:218", "Article 33 of GDPR")
 * @param toolName      The MCP tool name (e.g., "get_provision", "get_article")
 * @param toolArgs      The tool arguments for verification lookup
 * @param sourceUrl     Official portal URL (optional)
 * @param aliases       Alternative names the LLM might use (optional)
 */
export declare function buildCitation(canonicalRef: string, displayText: string, toolName: string, toolArgs: Record<string, string>, sourceUrl?: string | null, aliases?: string[]): CitationMetadata;
/**
 * Build citation metadata for a law MCP get_provision response.
 *
 * Handles Swedish-style YYYY:NNN statute IDs, chapter:section notation,
 * and short-name aliases. Other jurisdictions adapt field names.
 *
 * @param documentId     DB identifier (e.g., "2018:218", "LOV-2018-06-15-38")
 * @param documentTitle  Full title of the law
 * @param provisionRef   Provision reference (e.g., "34", "3:12")
 * @param inputDocId     The document_id argument as passed by the caller
 * @param inputSection   The section argument as passed by the caller
 * @param sourceUrl      Official portal URL (optional)
 * @param shortName      Short name / alias (optional)
 */
export declare function buildProvisionCitation(documentId: string, documentTitle: string, provisionRef: string, inputDocId: string, inputSection: string, sourceUrl?: string | null, shortName?: string | null): CitationMetadata;
/**
 * Build citation for a sector regulator decision/regulation.
 *
 * @param reference      Decision/regulation reference (e.g., "FFFS 2024:1")
 * @param title          Full title
 * @param toolName       Tool name (e.g., "se_dp_get_decision")
 * @param toolArgs       Tool arguments
 * @param authority      Issuing authority (e.g., "IMY", "FI")
 * @param sourceUrl      Official URL (optional)
 */
export declare function buildRegulationCitation(reference: string, title: string, toolName: string, toolArgs: Record<string, string>, authority?: string | null, sourceUrl?: string | null): CitationMetadata;
//# sourceMappingURL=citation.d.ts.map