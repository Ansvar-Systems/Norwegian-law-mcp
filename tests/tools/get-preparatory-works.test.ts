import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Database } from '@ansvar/mcp-sqlite';
import { getPreparatoryWorks } from '../../src/tools/get-preparatory-works.js';
import { createTestDatabase, closeTestDatabase } from '../fixtures/test-db.js';

describe('get_preparatory_works', () => {
  let db: Database;

  beforeAll(() => {
    db = createTestDatabase();
  });

  afterAll(() => {
    closeTestDatabase(db);
  });

  it('should return preparatory works for a statute', async () => {
    const response = await getPreparatoryWorks(db, { document_id: 'LOV-2018-06-15-38' });

    expect(response.results.length).toBe(2); // Prop. and SOU
    expect(response.results[0]).toHaveProperty('statute_id', 'LOV-2018-06-15-38');
    expect(response.results[0]).toHaveProperty('prep_document_id');
    expect(response.results[0]).toHaveProperty('prep_title');
  });

  it('should include both propositions and SOUs', async () => {
    const response = await getPreparatoryWorks(db, { document_id: 'LOV-2018-06-15-38' });

    const types = response.results.map(r => r.prep_type);
    expect(types).toContain('bill');
    expect(types).toContain('sou');
  });

  it('should return empty array for statute with no preparatory works', async () => {
    const response = await getPreparatoryWorks(db, { document_id: 'LOV-2000-04-14-31' });
    expect(response.results).toEqual([]);
  });

  it('should throw for missing document_id', async () => {
    await expect(
      getPreparatoryWorks(db, { document_id: '' })
    ).rejects.toThrow('document_id is required');
  });
});
