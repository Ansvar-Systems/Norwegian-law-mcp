/**
 * Tool registry for Norwegian Legal Citation MCP Server.
 * Shared between stdio (index.ts) and HTTP (api/mcp.ts) entry points.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import Database from '@ansvar/mcp-sqlite';

import { searchLegislation, SearchLegislationInput } from './search-legislation.js';
import { getProvision, GetProvisionInput } from './get-provision.js';
import { searchCaseLaw, SearchCaseLawInput } from './search-case-law.js';
import { getPreparatoryWorks, GetPreparatoryWorksInput } from './get-preparatory-works.js';
import { validateCitationTool, ValidateCitationInput } from './validate-citation.js';
import { buildLegalStance, BuildLegalStanceInput } from './build-legal-stance.js';
import { formatCitationTool, FormatCitationInput } from './format-citation.js';
import { checkCurrency, CheckCurrencyInput } from './check-currency.js';
import { getEUBasis, GetEUBasisInput } from './get-eu-basis.js';
import { getNorwegianImplementations, GetNorwegianImplementationsInput } from './get-norwegian-implementations.js';
import { searchEUImplementations, SearchEUImplementationsInput } from './search-eu-implementations.js';
import { getProvisionEUBasis, GetProvisionEUBasisInput } from './get-provision-eu-basis.js';
import { validateEUCompliance, ValidateEUComplianceInput } from './validate-eu-compliance.js';
import { getAbout, type AboutContext } from './about.js';
import { listSources } from './list-sources.js';
export type { AboutContext } from './about.js';

const ABOUT_TOOL: Tool = {
  name: 'about',
  description:
    'Server metadata, dataset statistics, freshness, and provenance. ' +
    'Call this to verify data coverage, currency, and content basis before relying on results. ' +
    'Do NOT use this for detailed source attribution — use list_sources instead. ' +
    'Do NOT use this for searching legislation — use search_legislation instead.',
  inputSchema: {
    type: 'object',
    properties: {},
  },
};

export const TOOLS: Tool[] = [
  {
    name: 'search_legislation',
    description: `Search Norwegian statutes and regulations by keyword. Returns matched provisions with snippets, relevance scores, and document metadata.

Searches provision text using FTS5 with BM25 ranking. Supports boolean operators (AND, OR, NOT), phrase search ("exact phrase"), and prefix matching (term*).

Use this for open-ended keyword searches when you do not know the exact statute or provision. Do NOT use this if you already know the LOV id and provision reference — use get_provision instead. For broad legal research across multiple source types, use build_legal_stance.`,
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query in Norwegian or English. Supports FTS5 syntax.' },
        document_id: { type: 'string', description: 'Filter to a specific statute by LOV id (e.g., "LOV-2018-06-15-38")' },
        status: { type: 'string', enum: ['in_force', 'amended', 'repealed'], description: 'Filter by document status' },
        as_of_date: { type: 'string', description: 'Optional historical date filter (YYYY-MM-DD).', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
        limit: { type: 'number', description: 'Maximum results (default: 10, max: 50)', minimum: 1, maximum: 50, default: 10 },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_provision',
    description: `Retrieve a specific provision from a Norwegian statute by its exact reference.

Specify the LOV id and either chapter+section or provision_ref directly.
Examples: document_id="LOV-2018-06-15-38", chapter="1", section="1" or provision_ref="1:1".
Omit chapter/section/provision_ref to get all provisions in the statute.

Use this when you know the exact statute and provision. Do NOT use this for keyword searches — use search_legislation instead.`,
    inputSchema: {
      type: 'object',
      properties: {
        document_id: { type: 'string', description: 'LOV id (e.g., "LOV-2018-06-15-38")' },
        chapter: { type: 'string', description: 'Chapter number (e.g., "3").' },
        section: { type: 'string', description: 'Section number (e.g., "5", "5 a")' },
        provision_ref: { type: 'string', description: 'Direct provision reference (e.g., "3:5")' },
        as_of_date: { type: 'string', description: 'Optional historical date (YYYY-MM-DD).', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
        limit: { type: 'number', description: 'Max provisions when fetching all (default: 100, max: 500). Only applies when no specific provision is requested.', minimum: 1, maximum: 500, default: 100 },
      },
      required: ['document_id'],
    },
  },
  {
    name: 'search_case_law',
    description: `Search Norwegian court decisions (rettsavgjorelser) by keyword. Searches case summaries and keywords with FTS5. Filter by court (HR for Hoyesterett, LA/LB for lagmannsrett, etc.) and date range.

Use this for finding relevant case law. Do NOT use this for statute text — use search_legislation instead. For comprehensive research across statutes, case law, and preparatory works simultaneously, use build_legal_stance.`,
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query for case law summaries' },
        court: { type: 'string', description: 'Filter by court (e.g., "HR", "LA", "LB")' },
        date_from: { type: 'string', description: 'Start date filter (ISO 8601)', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
        date_to: { type: 'string', description: 'End date filter (ISO 8601)', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
        limit: { type: 'number', description: 'Maximum results (default: 10, max: 50)', minimum: 1, maximum: 50, default: 10 },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_preparatory_works',
    description: `Get preparatory works (forarbeider) for a Norwegian statute. Returns linked propositions (Ot.prp./Prop. L), NOU reports, and related documents with summaries.

Essential for understanding legislative intent behind statutory provisions. Use this when you need to trace the reasoning behind a specific law. Do NOT use this for finding the law text itself — use get_provision or search_legislation instead.`,
    inputSchema: {
      type: 'object',
      properties: {
        document_id: { type: 'string', description: 'LOV id of the statute (e.g., "LOV-2018-06-15-38")' },
        limit: { type: 'number', description: 'Max results (default: 50, max: 200)', minimum: 1, maximum: 200, default: 50 },
      },
      required: ['document_id'],
    },
  },
  {
    name: 'validate_citation',
    description: `Validate a Norwegian legal citation against the database. Parses the citation string, checks that the document and provision exist, and returns warnings about status (repealed, amended). This is the zero-hallucination enforcer — use it to verify any citation before presenting it as fact.

Supported formats: "LOV-2018-06-15-38 § 1", "LOV-2018-06-15-38 1:1", "HR-2020-00000-A".

Do NOT use this for searching — use search_legislation instead. Do NOT use this for formatting — use format_citation instead.`,
    inputSchema: {
      type: 'object',
      properties: {
        citation: { type: 'string', description: 'Citation string to validate' },
      },
      required: ['citation'],
    },
  },
  {
    name: 'build_legal_stance',
    description: `Build a comprehensive set of citations for a legal question. Searches across statutes, case law, and preparatory works simultaneously to aggregate relevant citations.

Use this for broad legal research questions that need multiple source types. Do NOT use this for simple statute searches — use search_legislation instead. Do NOT use this when you already know the exact provision — use get_provision instead.`,
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Legal question or topic to research' },
        document_id: { type: 'string', description: 'Optionally limit statute search to one document' },
        include_case_law: { type: 'boolean', description: 'Include case law results (default: true)', default: true },
        include_preparatory_works: { type: 'boolean', description: 'Include preparatory works results (default: true)', default: true },
        as_of_date: { type: 'string', description: 'Optional historical date (YYYY-MM-DD).', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
        limit: { type: 'number', description: 'Max results per category (default: 5, max: 20)', minimum: 1, maximum: 20, default: 5 },
      },
      required: ['query'],
    },
  },
  {
    name: 'format_citation',
    description: `Format a Norwegian legal citation per standard conventions. Output formats: full ("LOV LOV-2018-06-15-38 Kapittel 3 § 5"), short ("LOV-2018-06-15-38 3:5"), pinpoint ("Kapittel 3 § 5").

Use this for consistent citation formatting. Do NOT use this to validate whether a citation is correct — use validate_citation instead.`,
    inputSchema: {
      type: 'object',
      properties: {
        citation: { type: 'string', description: 'Citation string to format' },
        format: { type: 'string', enum: ['full', 'short', 'pinpoint'], description: 'Output format (default: "full")', default: 'full' },
      },
      required: ['citation'],
    },
  },
  {
    name: 'check_currency',
    description: `Check if a Norwegian statute or provision is currently in force, amended, or repealed. Returns status, dates, and warnings. Provide as_of_date for historical evaluation.

Use this to verify a law's validity before citing it. Do NOT use this for searching legislation text — use search_legislation instead.`,
    inputSchema: {
      type: 'object',
      properties: {
        document_id: { type: 'string', description: 'LOV id (e.g., "LOV-2018-06-15-38")' },
        provision_ref: { type: 'string', description: 'Optional provision reference (e.g., "3:5")' },
        as_of_date: { type: 'string', description: 'Optional historical date (YYYY-MM-DD).', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
      },
      required: ['document_id'],
    },
  },
  {
    name: 'get_eu_basis',
    description: `Get EU legal basis (directives and regulations) for a Norwegian statute. Returns all EU directives and regulations that this statute implements, supplements, or references. Includes reference types, article citations, and primary implementation status.

Use this when you know the Norwegian statute and want to find its EU basis. Do NOT use this for the reverse lookup (EU → Norwegian) — use get_norwegian_implementations instead. For provision-level EU references, use get_provision_eu_basis.`,
    inputSchema: {
      type: 'object',
      properties: {
        law_id: { type: 'string', description: 'LOV id (e.g., "LOV-2018-06-15-38")' },
        include_articles: { type: 'boolean', description: 'Include specific EU article references (default: false)', default: false },
        reference_types: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['implements', 'supplements', 'applies', 'cites_article', 'references'],
          },
          description: 'Filter by reference type (implements, supplements, applies, etc.)',
        },
      },
      required: ['law_id'],
    },
  },
  {
    name: 'get_norwegian_implementations',
    description: `Find Norwegian statutes implementing a specific EU directive or regulation. Given an EU document ID (e.g., "regulation:2016/679" for GDPR), returns all Norwegian statutes that implement, supplement, or reference it.

Use this for EU → Norwegian lookup. Do NOT use this for Norwegian → EU lookup — use get_eu_basis instead. For exploratory EU document searches, use search_eu_implementations.`,
    inputSchema: {
      type: 'object',
      properties: {
        eu_document_id: { type: 'string', description: 'EU document ID (e.g., "regulation:2016/679")' },
        primary_only: { type: 'boolean', description: 'Return only primary implementing statutes (default: false)', default: false },
        in_force_only: { type: 'boolean', description: 'Return only in-force statutes (default: false)', default: false },
      },
      required: ['eu_document_id'],
    },
  },
  {
    name: 'search_eu_implementations',
    description: `Search for EU directives and regulations by keyword with Norwegian implementation counts. Search by keyword, type, year range, or community. Returns matching EU documents with counts of Norwegian statutes referencing them.

Use this for exploratory searches like "data protection" or "privacy" to find relevant EU law. Do NOT use this if you already know the EU document ID — use get_norwegian_implementations instead.`,
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Keyword search (title, short name, CELEX, description)' },
        type: { type: 'string', enum: ['directive', 'regulation'], description: 'Filter by document type' },
        year_from: { type: 'number', description: 'Filter by year (from)' },
        year_to: { type: 'number', description: 'Filter by year (to)' },
        community: { type: 'string', enum: ['EU', 'EG', 'EEG', 'Euratom'], description: 'Filter by community' },
        has_norwegian_implementation: { type: 'boolean', description: 'Filter by Norwegian implementation existence' },
        limit: { type: 'number', description: 'Maximum results (default: 20, max: 100)', minimum: 1, maximum: 100, default: 20 },
      },
    },
  },
  {
    name: 'get_provision_eu_basis',
    description: `Get EU legal basis for a specific provision within a Norwegian statute. Returns EU directives/regulations that a specific provision implements or references, with article-level precision.

Use this for pinpoint EU compliance checks at the provision level. Do NOT use this for statute-level EU basis — use get_eu_basis instead.`,
    inputSchema: {
      type: 'object',
      properties: {
        law_id: { type: 'string', description: 'LOV id (e.g., "LOV-2018-06-15-38")' },
        provision_ref: { type: 'string', description: 'Provision reference (e.g., "1:1" or "3:5")' },
      },
      required: ['law_id', 'provision_ref'],
    },
  },
  {
    name: 'validate_eu_compliance',
    description: `Validate EU compliance status for a Norwegian statute or provision. Checks for references to repealed EU directives, missing implementation status, and outdated references. Returns compliance status (compliant, partial, unclear, not_applicable) with warnings and recommendations.

Use this for compliance assessment. Do NOT use this just to find EU references — use get_eu_basis or get_provision_eu_basis instead.`,
    inputSchema: {
      type: 'object',
      properties: {
        law_id: { type: 'string', description: 'LOV id (e.g., "LOV-2018-06-15-38")' },
        provision_ref: { type: 'string', description: 'Optional provision reference (e.g., "1:1")' },
        eu_document_id: { type: 'string', description: 'Optional: check compliance with specific EU document' },
      },
      required: ['law_id'],
    },
  },
  {
    name: 'list_sources',
    description: 'List all data sources used by this MCP server with provenance metadata. Returns source authority, official portal URL, retrieval method, update frequency, licensing terms, coverage scope, and data freshness information. Use this to understand where the data comes from and how current it is. Do NOT use this for dataset-level statistics — use about instead.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

export function buildTools(context?: AboutContext): Tool[] {
  return context ? [...TOOLS, ABOUT_TOOL] : TOOLS;
}

export function registerTools(
  server: Server,
  db: InstanceType<typeof Database>,
  context?: AboutContext,
): void {
  const allTools = buildTools(context);

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: allTools };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      let result: unknown;

      switch (name) {
        case 'search_legislation':
          result = await searchLegislation(db, args as unknown as SearchLegislationInput);
          break;
        case 'get_provision':
          result = await getProvision(db, args as unknown as GetProvisionInput);
          break;
        case 'search_case_law':
          result = await searchCaseLaw(db, args as unknown as SearchCaseLawInput);
          break;
        case 'get_preparatory_works':
          result = await getPreparatoryWorks(db, args as unknown as GetPreparatoryWorksInput);
          break;
        case 'validate_citation':
          result = await validateCitationTool(db, args as unknown as ValidateCitationInput);
          break;
        case 'build_legal_stance':
          result = await buildLegalStance(db, args as unknown as BuildLegalStanceInput);
          break;
        case 'format_citation':
          result = await formatCitationTool(args as unknown as FormatCitationInput);
          break;
        case 'check_currency':
          result = await checkCurrency(db, args as unknown as CheckCurrencyInput);
          break;
        case 'get_eu_basis':
          result = await getEUBasis(db, args as unknown as GetEUBasisInput);
          break;
        case 'get_norwegian_implementations':
          result = await getNorwegianImplementations(db, args as unknown as GetNorwegianImplementationsInput);
          break;
        case 'search_eu_implementations':
          result = await searchEUImplementations(db, args as unknown as SearchEUImplementationsInput);
          break;
        case 'get_provision_eu_basis':
          result = await getProvisionEUBasis(db, args as unknown as GetProvisionEUBasisInput);
          break;
        case 'validate_eu_compliance':
          result = await validateEUCompliance(db, args as unknown as ValidateEUComplianceInput);
          break;
        case 'list_sources':
          result = await listSources(db);
          break;
        case 'about':
          if (context) {
            result = getAbout(db, context);
          } else {
            return {
              content: [{ type: 'text', text: 'About tool not configured.' }],
              isError: true,
            };
          }
          break;
        default:
          return {
            content: [{ type: 'text', text: `Error: Unknown tool "${name}".` }],
            isError: true,
          };
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: 'text', text: `Error executing ${name}: ${message}` }],
        isError: true,
      };
    }
  });
}
