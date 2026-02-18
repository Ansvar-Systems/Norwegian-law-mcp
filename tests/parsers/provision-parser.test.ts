import { describe, it, expect } from 'vitest';
import { parseStatuteText, isChapteredStatute } from '../../src/parsers/provision-parser.js';

describe('parseStatuteText', () => {
  it('should parse a chaptered statute', () => {
    const text = `
1 kap. Innledende bestemmelser

1 § Denne loven utfyller EUs personvernforordning.

2 § Loven gjelder ved behandling av personopplysninger.

2 kap. Rettslig grunnlag

1 § Personopplysninger kan behandles dersom det finnes rettslig grunnlag.
    `;

    const provisions = parseStatuteText(text);

    expect(provisions).toHaveLength(3);
    expect(provisions[0]).toEqual({
      provision_ref: '1:1',
      chapter: '1',
      section: '1',
      title: undefined,
      content: 'Denne loven utfyller EUs personvernforordning.',
    });
    expect(provisions[1].provision_ref).toBe('1:2');
    expect(provisions[1].chapter).toBe('1');
    expect(provisions[2].provision_ref).toBe('2:1');
    expect(provisions[2].chapter).toBe('2');
  });

  it('should parse a flat statute (no chapters)', () => {
    const text = `
1 § Formålet med denne loven er å beskytte personopplysninger.

2 § Loven gjelder for alle.

3 § Definisjoner angis her.
    `;

    const provisions = parseStatuteText(text);

    expect(provisions).toHaveLength(3);
    expect(provisions[0]).toEqual({
      provision_ref: '1',
      chapter: undefined,
      section: '1',
      title: undefined,
      content: 'Formålet med denne loven er å beskytte personopplysninger.',
    });
    expect(provisions[2].provision_ref).toBe('3');
  });

  it('should handle special section numbering (5 a §)', () => {
    const text = `
5 § Grunnregel.

5 a § Unntaksregel for viss behandling.

6 § Neste paragraf.
    `;

    const provisions = parseStatuteText(text);

    expect(provisions).toHaveLength(3);
    expect(provisions[1].provision_ref).toBe('5 a');
    expect(provisions[1].section).toBe('5 a');
  });

  it('should detect rubrik (title) on provisions', () => {
    const text = `
1 kap. Innledende bestemmelser

1 §
Lovens formål
Denne loven utfyller EUs personvernforordning.
    `;

    const provisions = parseStatuteText(text);

    expect(provisions).toHaveLength(1);
    expect(provisions[0].title).toBe('Lovens formål');
    expect(provisions[0].content).toBe('Denne loven utfyller EUs personvernforordning.');
  });

  it('should handle multi-paragraph sections', () => {
    const text = `
1 § Første ledd av paragrafen.
Andre ledd av paragrafen.
Tredje ledd av paragrafen.
    `;

    const provisions = parseStatuteText(text);

    expect(provisions).toHaveLength(1);
    expect(provisions[0].content).toContain('Første ledd');
    expect(provisions[0].content).toContain('Tredje ledd');
  });

  it('should return empty array for empty input', () => {
    expect(parseStatuteText('')).toEqual([]);
  });
});

describe('isChapteredStatute', () => {
  it('should detect chaptered text', () => {
    expect(isChapteredStatute('1 kap. Innledende bestemmelser')).toBe(true);
  });

  it('should detect non-chaptered text', () => {
    expect(isChapteredStatute('1 § Denne loven gjelder...')).toBe(false);
  });
});
