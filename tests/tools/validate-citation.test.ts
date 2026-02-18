import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Database } from '@ansvar/mcp-sqlite';
import { validateCitationTool } from '../../src/tools/validate-citation.js';
import { createTestDatabase, closeTestDatabase } from '../fixtures/test-db.js';

describe('validate_citation tool', () => {
  let db: Database;

  beforeAll(() => {
    db = createTestDatabase();
  });

  afterAll(() => {
    closeTestDatabase(db);
  });

  it('should validate a fully valid citation', async () => {
    const response = await validateCitationTool(db, {
      citation: 'LOV-2018-06-15-38',
    });

    expect(response.results.valid).toBe(true);
    expect(response.results.document_exists).toBe(true);
    expect(response.results.provision_exists).toBe(true);
    expect(response.results.formatted_citation).toContain('LOV-2018-06-15-38');
    expect(response.results.document_title).toContain('personopplysninger');
    expect(response.results.warnings).toHaveLength(0);
  });

  it('should return warnings for repealed statute', async () => {
    const response = await validateCitationTool(db, {
      citation: 'LOV-2000-04-14-31',
    });

    expect(response.results.document_exists).toBe(true);
    expect(response.results.warnings.some(w => w.includes('repealed'))).toBe(true);
  });

  it('should handle empty citation', async () => {
    const response = await validateCitationTool(db, { citation: '' });

    expect(response.results.valid).toBe(false);
    expect(response.results.warnings).toContain('Empty citation');
  });

  it('should report non-existent document', async () => {
    const response = await validateCitationTool(db, {
      citation: 'SFS 9999:999',
    });

    expect(response.results.valid).toBe(false);
    expect(response.results.document_exists).toBe(false);
  });

  it('should report non-existent provision', async () => {
    const response = await validateCitationTool(db, {
      citation: 'LOV-2018-06-15-38 § 99',
    });

    expect(response.results.valid).toBe(false);
    expect(response.results.document_exists).toBe(true);
    expect(response.results.provision_exists).toBe(false);
  });
});
