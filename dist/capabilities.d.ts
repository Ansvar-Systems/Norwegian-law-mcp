/**
 * Runtime capability detection for Norwegian Law MCP server.
 *
 * Detects available features by checking which tables exist in the database.
 * This allows the same server code to work with both free and paid-tier databases —
 * the database contents determine the behavior, not configuration flags.
 */
import type Database from '@ansvar/mcp-sqlite';
export type Capability = 'core_legislation' | 'basic_case_law' | 'eu_references' | 'expanded_case_law' | 'full_preparatory_works' | 'agency_guidance';
export type Tier = 'free' | 'professional' | 'unknown';
export interface DbMetadata {
    tier: Tier;
    schema_version: string;
    built_at: string;
    builder: string;
}
/**
 * Detect which capabilities are available based on table existence.
 * A capability is present if its required table exists in the schema.
 */
export declare function detectCapabilities(db: InstanceType<typeof Database>): Set<Capability>;
/**
 * Read db_metadata table if it exists. Returns defaults if table is missing.
 */
export declare function readDbMetadata(db: InstanceType<typeof Database>): DbMetadata;
/**
 * Check if a specific capability requires the professional tier.
 */
export declare function isProfessionalCapability(capability: Capability): boolean;
/**
 * Standard upgrade message when a professional feature is requested but unavailable.
 */
export declare function upgradeMessage(feature: string): string;
//# sourceMappingURL=capabilities.d.ts.map