import { describe, it, expect } from 'vitest';
import { parseLovdataProvisions } from '../../src/parsers/lovdata-provision-parser.js';

describe('parseLovdataProvisions', () => {
  it('captures title lines that appear before section markers', () => {
    const text = `
1 kap. Innledende bestemmelser

Lovens virkeområde
1 § Denne loven gjelder.
2 § Neste bestemmelse.
`;

    const result = parseLovdataProvisions(text);

    expect(result.provisions).toHaveLength(2);
    expect(result.provisions[0].provision_ref).toBe('1:1');
    expect(result.provisions[0].title).toBe('Lovens virkeområde');
    expect(result.provisions[0].content).toBe('Denne loven gjelder.');
  });

  it('ignores spurious chapter markers when the next section does not restart at 1 §', () => {
    const text = `
2 kap. Om norsk retts anvendelse
1 § Første bestemmelse.
5 § Femte bestemmelse.
6 kap. Om seksualforbrytelser
6 § Sjette bestemmelse i samme kapittel.
7 § Sjuende bestemmelse i samme kapittel.
3 kap. Om straffereaksjoner
1 § Første bestemmelse i nytt kapittel.
`;

    const result = parseLovdataProvisions(text);
    const refs = result.provisions.map(p => p.provision_ref);

    expect(refs).toEqual(['2:1', '2:5', '2:6', '2:7', '3:1']);
    expect(result.diagnostics.ignored_chapter_markers).toBe(1);
  });

  it('suppresses inline lower-case section-like references inside a provision', () => {
    const text = `
1 kap. Innledende bestemmelser
1 § Hovedregel.
2 § skal anvendes i visse tilfeller.
fortsatt tekst i samme paragraf.
2 § Den andre paragrafen begynner her.
`;

    const result = parseLovdataProvisions(text);

    expect(result.provisions).toHaveLength(2);
    expect(result.provisions[0].provision_ref).toBe('1:1');
    expect(result.provisions[0].content).toContain('2 § skal anvendes i visse tilfeller.');
    expect(result.provisions[1].provision_ref).toBe('1:2');
    expect(result.diagnostics.suppressed_section_candidates).toBe(1);
  });

  it('suppresses out-of-order section candidates that re-use an earlier section number', () => {
    const text = `
1 kap. Testkapittel
1 § Første paragraf.
2 § Andre paragraf.
1 § gjengis her kun som henvisning.
3 § Tredje paragraf.
`;

    const result = parseLovdataProvisions(text);

    expect(result.provisions).toHaveLength(3);
    expect(result.provisions[1].provision_ref).toBe('1:2');
    expect(result.provisions[1].content).toContain('1 § gjengis her kun som henvisning.');
    expect(result.provisions[2].provision_ref).toBe('1:3');
    expect(result.diagnostics.suppressed_section_candidates).toBe(1);
  });

  it('suppresses suspicious large section jumps in flat statutes', () => {
    const text = `
1 § Første paragraf.
2 § Andre paragraf.
3 § Ved anvendelse av 5 a, 6 h, 7 a, 11, 15, 22, 25, 26 og
39 § gjelder følgende særlige bestemmelser om beregning av ansettelsestid.
4 § Fjerde paragraf.
`;

    const result = parseLovdataProvisions(text);
    const refs = result.provisions.map(p => p.provision_ref);

    expect(refs).toEqual(['1', '2', '3', '4']);
    expect(result.provisions[2].content).toContain('39 § gjelder følgende særlige bestemmelser');
    expect(result.diagnostics.suppressed_section_candidates).toBe(1);
  });
});
