/**
 * list_sources — Return data source provenance for this MCP server.
 */
import { generateResponseMetadata } from '../utils/metadata.js';
export async function listSources(db) {
    const result = {
        mcp_name: 'Norwegian Law MCP',
        jurisdiction: 'NO',
        sources: [
            {
                name: 'Lovdata',
                authority: 'Lovdata Foundation (Stiftelsen Lovdata)',
                official_portal: 'https://lovdata.no',
                retrieval_method: 'WEB_SCRAPING',
                update_frequency: 'weekly',
                last_ingested: '2026-02-14',
                license: {
                    type: 'Lovdata Terms of Use',
                    url: 'https://lovdata.no/info/vilkar',
                    summary: 'Norwegian legislation is public; Lovdata consolidation is a public service. Reuse permitted with attribution.',
                },
                coverage: {
                    scope: 'Norwegian statutes (lover) and regulations (forskrifter)',
                    limitations: 'Lovdata free tier has limited historical versions; paid tier has full history',
                },
                languages: ['no', 'nn'],
            },
        ],
        data_freshness: {
            automated_checks: true,
            check_frequency: 'daily',
            last_verified: '2026-02-15',
        },
    };
    return {
        results: result,
        _metadata: generateResponseMetadata(db),
    };
}
//# sourceMappingURL=list-sources.js.map