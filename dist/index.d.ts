#!/usr/bin/env node
/**
 * Norwegian Legal Citation MCP Server
 *
 * Provides 8 tools for querying Norwegian statutes, case law,
 * preparatory works, and legal citations.
 *
 * Zero-hallucination: never generates citations, only returns verified database entries.
 */
import { type Capability, type DbMetadata } from './capabilities.js';
export declare function getCapabilities(): Set<Capability>;
export declare function getMetadata(): DbMetadata;
//# sourceMappingURL=index.d.ts.map