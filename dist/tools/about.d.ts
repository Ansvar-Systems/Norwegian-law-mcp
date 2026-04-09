/**
 * about — Server metadata, dataset statistics, and provenance.
 */
import type Database from '@ansvar/mcp-sqlite';
export interface AboutContext {
    version: string;
    fingerprint: string;
    dbBuilt: string;
}
export declare function getAbout(db: InstanceType<typeof Database>, context: AboutContext): {
    name: string;
    version: string;
    jurisdiction: string;
    description: string;
    stats: Record<string, number>;
    data_sources: {
        name: string;
        url: string;
        authority: string;
    }[];
    freshness: {
        database_built: string;
    };
    disclaimer: string;
    network: {
        name: string;
        open_law: string;
        directory: string;
    };
};
//# sourceMappingURL=about.d.ts.map