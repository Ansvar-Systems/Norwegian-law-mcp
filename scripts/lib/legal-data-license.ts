/**
 * Legal data licensing policy controls for Norwegian legal sources.
 *
 * Posture is source-specific and evidence-driven:
 * - Full-text statute ingestion is allowed only where reuse rights are explicit.
 * - Otherwise ingestion is forced to metadata + stable deep links.
 */

export type LegalSource = 'lovdata' | 'lovtidend' | 'domstol';

export interface LegalDataLicensePolicy {
  source: LegalSource;
  rights_status: 'allowed' | 'restricted' | 'unclear';
  allow_full_text_cache: boolean;
  allow_full_text_redistribution: boolean;
  allow_metadata_cache: boolean;
  allow_deep_links: boolean;
  fetch_on_demand_required: boolean;
  required_attribution: string;
  policy_notes: string[];
  evidence: string[];
  last_reviewed: string;
}

export interface IngestionDecision {
  mode: 'full_text' | 'metadata_only';
  reason: string;
  policy: LegalDataLicensePolicy;
}

export const LEGAL_DATA_POLICIES: Record<LegalSource, LegalDataLicensePolicy> = {
  lovdata: {
    source: 'lovdata',
    rights_status: 'restricted',
    allow_full_text_cache: false,
    allow_full_text_redistribution: false,
    allow_metadata_cache: false,
    allow_deep_links: true,
    fetch_on_demand_required: true,
    required_attribution: 'Lovdata (lovdata.no) — content not redistributed under takedown 2026-05-02',
    policy_notes: [
      'WITHDRAWN 2026-05-02. Lovdata vilkår §2.1 prohibits non-personal/commercial use, mass downloading, and AI training.',
      'Earlier policy cited §2.3 NLOD 2.0 as covering HTML scraping. That claim was materially false: §2.3 covers api.lovdata.no, not site scraping.',
      'Phase 2 rebuild planned via api.lovdata.no, conditional on terms verification.',
    ],
    evidence: [
      'Lovdata vilkår §2.1: explicit prohibition on non-personal/commercial use, mass downloading, AI training.',
      'Lovdata vilkår §2.3 (NLOD 2.0 exception): covers api.lovdata.no API path, not www.lovdata.no/dokument/ HTML.',
    ],
    last_reviewed: '2026-05-02',
  },
  lovtidend: {
    source: 'lovtidend',
    rights_status: 'restricted',
    allow_full_text_cache: false,
    allow_full_text_redistribution: false,
    allow_metadata_cache: false,
    allow_deep_links: true,
    fetch_on_demand_required: true,
    required_attribution: 'Norsk Lovtidend / Lovdata — content not redistributed under takedown 2026-05-02',
    policy_notes: [
      'WITHDRAWN 2026-05-02. Earlier policy cited §2.3 NLOD 2.0 reuse; that claim shared the lovdata block defect.',
      'Phase 2 rebuild planned via api.lovdata.no, conditional on terms verification.',
    ],
    evidence: [
      'Lovdata vilkår §2.1: prohibits non-personal/commercial use, mass downloading, AI training of Lovtidend rule texts as published on lovdata.no.',
      'Lovdata vilkår §2.3 (NLOD 2.0 exception) covers the api.lovdata.no path, not the www.lovdata.no HTML surface.',
    ],
    last_reviewed: '2026-05-02',
  },
  domstol: {
    source: 'domstol',
    rights_status: 'restricted',
    allow_full_text_cache: false,
    allow_full_text_redistribution: false,
    allow_metadata_cache: true,
    allow_deep_links: true,
    fetch_on_demand_required: true,
    required_attribution: 'Official Norwegian court publication channels via deep links',
    policy_notes: [
      'Case-law full text is not cached/redistributed by default in this server.',
      'Use metadata indexing and official-link resolution only unless explicit rights exist.',
    ],
    evidence: [
      'No blanket full-text redistribution approval recorded for Norwegian court publication channels.',
    ],
    last_reviewed: '2026-02-15',
  },
};

export function resolveLicensePolicy(source: LegalSource): LegalDataLicensePolicy {
  return LEGAL_DATA_POLICIES[source];
}

export function decideIngestionMode(source: LegalSource, wantsFullText: boolean): IngestionDecision {
  if (source === 'lovdata' || source === 'lovtidend') {
    throw new Error(
      `${source} is locked under takedown 2026-05-02 (Lovdata vilkår §2.1). ` +
      'See LEGAL_DATA_LICENSE.md.'
    );
  }
  const policy = resolveLicensePolicy(source);

  if (!wantsFullText) {
    return {
      mode: 'metadata_only',
      reason: 'Full-text ingestion was not requested; using metadata + deep links.',
      policy,
    };
  }

  if (wantsFullText && policy.allow_full_text_cache && policy.allow_full_text_redistribution) {
    return {
      mode: 'full_text',
      reason: 'Full-text ingestion is explicitly permitted by current policy.',
      policy,
    };
  }

  return {
    mode: 'metadata_only',
    reason: policy.allow_full_text_cache
      ? 'Full-text redistribution is not permitted; using metadata + deep links.'
      : 'Full-text rights are unclear/restricted; using metadata + deep links by default.',
    policy,
  };
}
