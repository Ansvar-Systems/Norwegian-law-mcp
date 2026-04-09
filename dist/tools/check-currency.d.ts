/**
 * check_currency — Check if a statute or provision is current (in force).
 */
import type { Database } from '@ansvar/mcp-sqlite';
import { type ToolResponse } from '../utils/metadata.js';
export interface CheckCurrencyInput {
    document_id: string;
    provision_ref?: string;
    as_of_date?: string;
}
export interface CaseLawStats {
    last_updated: string;
    total_cases: number;
    source: string;
    source_url: string;
    attribution: string;
}
export interface CurrencyResult {
    document_id: string;
    title: string;
    status: string;
    type: string;
    issued_date: string | null;
    in_force_date: string | null;
    last_updated: string | null;
    is_current: boolean;
    as_of_date?: string;
    status_as_of?: 'in_force' | 'repealed' | 'not_yet_in_force';
    is_in_force_as_of?: boolean;
    provision_exists?: boolean;
    warnings: string[];
    case_law_stats?: CaseLawStats;
}
export declare function checkCurrency(db: Database, input: CheckCurrencyInput): Promise<ToolResponse<CurrencyResult | null>>;
//# sourceMappingURL=check-currency.d.ts.map