import { describe, it, expect } from 'vitest';
import { extractCrossReferences } from '../../src/parsers/cross-ref-extractor.js';

describe('extractCrossReferences', () => {
  describe('LOV (statute) references', () => {
    it('captures LOV id references', () => {
      const refs = extractCrossReferences('Se LOV-2018-06-15-38 for definisjoner.');
      expect(refs).toContainEqual({
        target_law_id: 'LOV-2018-06-15-38',
        raw_text: 'LOV-2018-06-15-38',
      });
    });

    it('captures "X kap. Y §" provision references in LOV format (chapter:section)', () => {
      const refs = extractCrossReferences('Jf. 3 kap. 5 § i loven.');
      expect(refs).toContainEqual({
        target_provision_ref: '3:5',
        raw_text: '3 kap. 5 \u00a7',
      });
    });
  });

  describe('FOR (forskrift / regulation) references', () => {
    it('captures FOR id references', () => {
      const refs = extractCrossReferences('Implementerer FOR-2018-09-14-1324.');
      expect(refs).toContainEqual({
        target_law_id: 'FOR-2018-09-14-1324',
        raw_text: 'FOR-2018-09-14-1324',
      });
    });

    it('captures "§ X-Y" provision references in FOR format (chapter embedded in section)', () => {
      const refs = extractCrossReferences('Se § 1-1 for virkeomr\u00e5de.');
      expect(refs).toContainEqual({
        target_provision_ref: '1-1',
        raw_text: '\u00a7 1-1',
      });
    });

    it('captures FOR-form provision refs with letter suffix (4-1a)', () => {
      const refs = extractCrossReferences('Etter \u00a7 4-1a skal det rapporteres.');
      expect(refs).toContainEqual({
        target_provision_ref: '4-1a',
        raw_text: '\u00a7 4-1a',
      });
    });

    it('captures both a FOR id and a FOR provision ref in the same text', () => {
      const refs = extractCrossReferences('Jf. \u00a7 1-1 i FOR-2018-09-14-1324.');
      expect(refs.map(r => r.target_law_id).filter(Boolean)).toContain('FOR-2018-09-14-1324');
      expect(refs.map(r => r.target_provision_ref).filter(Boolean)).toContain('1-1');
    });
  });

  describe('legacy SFS references (backward compat)', () => {
    it('captures (yyyy:nnn) SFS references', () => {
      const refs = extractCrossReferences('Se (2018:218) for tidligere bestemmelse.');
      expect(refs).toContainEqual({
        target_law_id: '2018:218',
        raw_text: '(2018:218)',
      });
    });
  });

  describe('deduplication', () => {
    it('deduplicates repeated references within the same text', () => {
      const refs = extractCrossReferences('LOV-2018-06-15-38 og LOV-2018-06-15-38 igjen.');
      const lovIds = refs.map(r => r.target_law_id).filter(id => id === 'LOV-2018-06-15-38');
      expect(lovIds).toHaveLength(1);
    });
  });
});
