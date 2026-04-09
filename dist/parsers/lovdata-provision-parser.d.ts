/**
 * Parser tuned for Norwegian statute text dumps.
 *
 * Source text may contain line-break artifacts and occasional table-of-contents
 * fragments. This parser uses conservative chapter activation and section
 * monotonicity checks to avoid mislabeling provisions.
 *
 * Note: Both Norwegian and Swedish statutes use "kap." for chapters and "§"
 * for sections, so the structural parsing logic is shared. This parser was
 * originally built for Riksdagen data but works for Lovdata-sourced text too.
 */
export interface LovdataProvision {
    provision_ref: string;
    chapter?: string;
    section: string;
    title?: string;
    content: string;
}
/** @deprecated Use LovdataProvision instead */
export type RiksdagenProvision = LovdataProvision;
export interface LovdataParseDiagnostics {
    ignored_chapter_markers: number;
    suppressed_section_candidates: number;
}
/** @deprecated Use LovdataParseDiagnostics instead */
export type RiksdagenParseDiagnostics = LovdataParseDiagnostics;
export interface LovdataParseResult {
    provisions: LovdataProvision[];
    diagnostics: LovdataParseDiagnostics;
}
/** @deprecated Use LovdataParseResult instead */
export type RiksdagenParseResult = LovdataParseResult;
/** @deprecated Use parseLovdataProvisions instead */
export declare function parseRiksdagenProvisions(text: string): LovdataParseResult;
export declare function parseLovdataProvisions(text: string): LovdataParseResult;
//# sourceMappingURL=lovdata-provision-parser.d.ts.map