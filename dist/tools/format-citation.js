/**
 * format_citation — Format a Norwegian legal citation per standard conventions.
 */
import { parseCitation } from '../citation/parser.js';
import { formatCitation } from '../citation/formatter.js';
import { generateResponseMetadata } from '../utils/metadata.js';
export async function formatCitationTool(input) {
    if (!input.citation || input.citation.trim().length === 0) {
        return {
            results: { input: '', formatted: '', type: 'unknown', valid: false, error: 'Empty citation' },
            _metadata: generateResponseMetadata()
        };
    }
    const parsed = parseCitation(input.citation);
    if (!parsed.valid) {
        return {
            results: {
                input: input.citation,
                formatted: input.citation,
                type: 'unknown',
                valid: false,
                error: parsed.error,
            },
            _metadata: generateResponseMetadata()
        };
    }
    const formatted = formatCitation(parsed, input.format ?? 'full');
    return {
        results: {
            input: input.citation,
            formatted,
            type: parsed.type,
            valid: true,
        },
        _metadata: generateResponseMetadata()
    };
}
//# sourceMappingURL=format-citation.js.map