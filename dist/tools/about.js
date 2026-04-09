/**
 * about — Server metadata, dataset statistics, and provenance.
 */
function safeCount(db, sql) {
    try {
        const row = db.prepare(sql).get();
        return row ? Number(row.count) : 0;
    }
    catch {
        return 0;
    }
}
export function getAbout(db, context) {
    const euRefs = safeCount(db, 'SELECT COUNT(*) as count FROM eu_references');
    const stats = {
        documents: safeCount(db, 'SELECT COUNT(*) as count FROM legal_documents'),
        provisions: safeCount(db, 'SELECT COUNT(*) as count FROM legal_provisions'),
        definitions: safeCount(db, 'SELECT COUNT(*) as count FROM definitions'),
    };
    if (euRefs > 0) {
        stats.eu_documents = safeCount(db, 'SELECT COUNT(*) as count FROM eu_documents');
        stats.eu_references = euRefs;
    }
    return {
        name: 'Norwegian Law MCP',
        version: context.version,
        jurisdiction: 'NO',
        description: 'Norwegian Law MCP — legislation via Model Context Protocol',
        stats,
        data_sources: [
            {
                name: 'Lovdata',
                url: 'https://lovdata.no',
                authority: 'Lovdata Foundation',
            },
        ],
        freshness: {
            database_built: context.dbBuilt,
        },
        disclaimer: 'This is a research tool, not legal advice. Verify critical citations against official sources.',
        network: {
            name: 'Ansvar MCP Network',
            open_law: 'https://ansvar.eu/open-law',
            directory: 'https://ansvar.ai/mcp',
        },
    };
}
//# sourceMappingURL=about.js.map