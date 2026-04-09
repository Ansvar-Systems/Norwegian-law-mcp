/**
 * Validate citations against the database (zero-hallucination enforcer).
 *
 * This module ensures that every citation returned by the server
 * corresponds to an actual entry in the database.
 */
import type { Database } from '@ansvar/mcp-sqlite';
import type { ValidationResult, ParsedCitation } from '../types/index.js';
/**
 * Validate a citation string against the database.
 *
 * @param db - Database connection
 * @param citation - Raw citation string
 * @returns Validation result with existence checks and warnings
 */
export declare function validateCitation(db: Database, citation: string): ValidationResult;
/**
 * Validate a pre-parsed citation against the database.
 */
export declare function validateParsedCitation(db: Database, parsed: ParsedCitation): ValidationResult;
//# sourceMappingURL=validator.d.ts.map