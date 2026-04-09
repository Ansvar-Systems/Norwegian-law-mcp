/**
 * Runtime capability detection for Norwegian Law MCP server.
 *
 * Detects available features by checking which tables exist in the database.
 * This allows the same server code to work with both free and paid-tier databases —
 * the database contents determine the behavior, not configuration flags.
 */
// ─────────────────────────────────────────────────────────────────────────────
// Table → Capability mapping
// ─────────────────────────────────────────────────────────────────────────────
const CAPABILITY_TABLES = {
    core_legislation: 'legal_provisions',
    basic_case_law: 'case_law',
    eu_references: 'eu_references',
    expanded_case_law: 'case_law_full',
    full_preparatory_works: 'preparatory_works_full',
    agency_guidance: 'agency_guidance',
};
const PROFESSIONAL_CAPABILITIES = [
    'expanded_case_law',
    'full_preparatory_works',
    'agency_guidance',
];
// ─────────────────────────────────────────────────────────────────────────────
// Detection
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Detect which capabilities are available based on table existence.
 * A capability is present if its required table exists in the schema.
 */
export function detectCapabilities(db) {
    const capabilities = new Set();
    const tables = new Set(db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()
        .map(r => r.name));
    for (const [capability, table] of Object.entries(CAPABILITY_TABLES)) {
        if (tables.has(table)) {
            capabilities.add(capability);
        }
    }
    return capabilities;
}
/**
 * Read db_metadata table if it exists. Returns defaults if table is missing.
 */
export function readDbMetadata(db) {
    const defaults = {
        tier: 'unknown',
        schema_version: '1',
        built_at: 'unknown',
        builder: 'unknown',
    };
    try {
        const hasTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='db_metadata'").get();
        if (!hasTable)
            return defaults;
        const rows = db.prepare('SELECT key, value FROM db_metadata').all();
        const meta = { ...defaults };
        for (const row of rows) {
            if (row.key === 'tier' && (row.value === 'free' || row.value === 'professional')) {
                meta.tier = row.value;
            }
            else if (row.key === 'schema_version') {
                meta.schema_version = row.value;
            }
            else if (row.key === 'built_at') {
                meta.built_at = row.value;
            }
            else if (row.key === 'builder') {
                meta.builder = row.value;
            }
        }
        return meta;
    }
    catch {
        return defaults;
    }
}
/**
 * Check if a specific capability requires the professional tier.
 */
export function isProfessionalCapability(capability) {
    return PROFESSIONAL_CAPABILITIES.includes(capability);
}
/**
 * Standard upgrade message when a professional feature is requested but unavailable.
 */
export function upgradeMessage(feature) {
    return (`${feature} is not available in this free community instance. ` +
        `The full case law and preparatory works databases are too large to serve from a free hosted endpoint. ` +
        `These datasets are included when Ansvar delivers consulting services, and may become available as a separate paid service in the future.`);
}
//# sourceMappingURL=capabilities.js.map