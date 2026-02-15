/**
 * EU implementation lookup tool.
 *
 * NOTE: This file keeps legacy "Swedish" export names for compatibility with
 * existing tests/clients while exposing Norwegian aliases used by this server.
 */

import type { Database } from '@ansvar/mcp-sqlite';
import type { EUDocument, SwedishImplementation } from '../types/index.js';
import { generateResponseMetadata, type ToolResponse } from '../utils/metadata.js';

export interface GetSwedishImplementationsInput {
  eu_document_id: string;
  primary_only?: boolean;
  in_force_only?: boolean;
}

export interface GetSwedishImplementationsResult {
  eu_document: {
    id: string;
    type: 'directive' | 'regulation';
    year: number;
    number: number;
    title?: string;
    short_name?: string;
    celex_number?: string;
  };
  implementations: SwedishImplementation[];
  statistics: {
    total_statutes: number;
    primary_implementations: number;
    in_force: number;
    repealed: number;
  };
}

export interface GetNorwegianImplementationsInput extends GetSwedishImplementationsInput {}
export interface GetNorwegianImplementationsResult extends GetSwedishImplementationsResult {}

async function runImplementationLookup(
  db: Database,
  input: GetSwedishImplementationsInput
): Promise<ToolResponse<GetSwedishImplementationsResult>> {
  if (!input.eu_document_id || !/^(directive|regulation):\d+\/\d+$/.test(input.eu_document_id)) {
    throw new Error(
      `Invalid EU document ID format: "${input.eu_document_id}". Expected format: "directive:YYYY/NNN" or "regulation:YYYY/NNN" (e.g., "regulation:2016/679")`
    );
  }

  const euDoc = db.prepare(`
    SELECT id, type, year, number, title, short_name, celex_number
    FROM eu_documents
    WHERE id = ?
  `).get(input.eu_document_id) as EUDocument | undefined;

  if (!euDoc) {
    throw new Error(`EU document ${input.eu_document_id} not found in database`);
  }

  let sql = `
    SELECT
      ld.id AS sfs_number,
      ld.title AS sfs_title,
      ld.short_name AS sfs_short_name,
      ld.status,
      er.reference_type,
      er.is_primary_implementation,
      er.implementation_status,
      GROUP_CONCAT(DISTINCT er.eu_article) AS articles_referenced
    FROM legal_documents ld
    JOIN eu_references er ON ld.id = er.document_id
    WHERE er.eu_document_id = ?
  `;

  const params: (string | number)[] = [input.eu_document_id];

  if (input.primary_only) {
    sql += ` AND er.is_primary_implementation = 1`;
  }

  if (input.in_force_only) {
    sql += ` AND ld.status = 'in_force'`;
  }

  sql += `
    GROUP BY ld.id
    ORDER BY er.is_primary_implementation DESC, ld.id
  `;

  interface QueryRow {
    sfs_number: string;
    sfs_title: string;
    sfs_short_name: string | null;
    status: string;
    reference_type: string;
    is_primary_implementation: number;
    implementation_status: string | null;
    articles_referenced: string | null;
  }

  const rows = db.prepare(sql).all(...params) as QueryRow[];

  const implementations: SwedishImplementation[] = rows.map(row => {
    const impl: SwedishImplementation = {
      sfs_number: row.sfs_number,
      sfs_title: row.sfs_title,
      status: row.status,
      reference_type: row.reference_type as any,
      is_primary_implementation: row.is_primary_implementation === 1,
    };

    if (row.sfs_short_name) impl.short_name = row.sfs_short_name;
    if (row.implementation_status) impl.implementation_status = row.implementation_status as any;
    if (row.articles_referenced) {
      impl.articles_referenced = row.articles_referenced.split(',').filter(a => a && a.trim());
    }

    return impl;
  });

  const result: GetSwedishImplementationsResult = {
    eu_document: {
      id: euDoc.id,
      type: euDoc.type,
      year: euDoc.year,
      number: euDoc.number,
      title: euDoc.title,
      short_name: euDoc.short_name,
      celex_number: euDoc.celex_number,
    },
    implementations,
    statistics: {
      total_statutes: implementations.length,
      primary_implementations: implementations.filter(i => i.is_primary_implementation).length,
      in_force: implementations.filter(i => i.status === 'in_force').length,
      repealed: implementations.filter(i => i.status === 'repealed').length,
    },
  };

  return {
    results: result,
    _metadata: generateResponseMetadata(db),
  };
}

export async function getSwedishImplementations(
  db: Database,
  input: GetSwedishImplementationsInput
): Promise<ToolResponse<GetSwedishImplementationsResult>> {
  return runImplementationLookup(db, input);
}

export async function getNorwegianImplementations(
  db: Database,
  input: GetNorwegianImplementationsInput
): Promise<ToolResponse<GetNorwegianImplementationsResult>> {
  return runImplementationLookup(db, input);
}
