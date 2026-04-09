/**
 * metadata.ts — Centralized metadata generation for all tool responses.
 *
 * Provides professional-use warnings, data freshness tracking, and source authority disclosure.
 */
import type { Database } from '@ansvar/mcp-sqlite';
export interface ResponseMetadata {
    /** Data freshness information */
    data_freshness: DataFreshness;
    /** Professional use disclaimer */
    disclaimer: string;
    /** Source authority disclosure */
    source_authority: SourceAuthority;
    /** Known coverage gaps */
    coverage_gaps: string[];
    /** EU AI Act transparency notice */
    ai_disclosure: string;
    /** Optional note (e.g., unresolved document_id) */
    note?: string;
    /** Query strategy used (e.g., 'broadened', 'like_fallback') */
    query_strategy?: string;
}
export interface DataFreshness {
    /** Last database update timestamp */
    statute_last_updated: string | null;
    /** Last case law sync timestamp */
    case_law_last_sync: string | null;
    /** Warning if data appears stale (>30 days) */
    staleness_warning: string | null;
}
export interface SourceAuthority {
    /** Primary data source description */
    primary_source: string;
    /** Authority level assessment */
    authority_level: 'official' | 'community-maintained';
    /** Verification requirement */
    verification_required: string;
}
/**
 * Generate standard metadata for tool responses.
 *
 * This provides consistent professional-use warnings, data freshness tracking,
 * and source authority disclosure across all tools.
 *
 * @param db - Optional database handle. If not provided, data freshness checks are skipped.
 */
export declare function generateResponseMetadata(db?: Database): ResponseMetadata;
/**
 * Wrapper type for tool responses that includes metadata.
 */
export interface ToolResponse<T> {
    /** Tool-specific results */
    results: T;
    /** Professional-use metadata and warnings */
    _metadata: ResponseMetadata;
    /** Citation metadata for deterministic source attribution */
    _citation?: import('./citation.js').CitationMetadata;
}
//# sourceMappingURL=metadata.d.ts.map