import type { DropshipEvidence } from "@/lib/extractors/dropship";
import { dropshipEvidenceScore } from "@/lib/extractors/dropship";
import { DEFAULT_SCORE_WEIGHTS } from "@/lib/db/defaults";

export type ScoreInput = {
  evidence: DropshipEvidence[];
  usConfidence: number;
  hasRoleEmail: boolean;
  hasPhone: boolean;
  hasApplicationForm: boolean;
  productCount?: number | null;
  priceMedian?: number | null;
  priceBandMin: number;
  priceBandMax: number;
  nicheMatch?: boolean;
  domainAgeYears?: number | null;
  hasPolicies?: boolean;
  recentActivity?: boolean;
  blocked?: boolean;
  marketplaceOnly?: boolean;
  weights?: Partial<typeof DEFAULT_SCORE_WEIGHTS>;
};

export type ScoreBreakdown = {
  dropshipEvidence: number;
  usConfidence: number;
  contactability: number;
  catalogFit: number;
  legitimacy: number;
  penalties: number;
  total: number;
  tier: "A" | "B" | "C" | "D";
  components: Record<string, number>;
};

export function computeScore(input: ScoreInput): ScoreBreakdown {
  const w = { ...DEFAULT_SCORE_WEIGHTS, ...input.weights };

  const dropship = Math.min(w.dropshipEvidence, dropshipEvidenceScore(input.evidence));
  // rescale raw 0-40 evidence into weight
  const dropshipEvidence = (dropship / 40) * w.dropshipEvidence;

  const usConfidence = Math.min(w.usConfidence, input.usConfidence * w.usConfidence);

  let contactability = 0;
  if (input.hasRoleEmail) contactability += w.contactability * 0.5;
  if (input.hasPhone) contactability += w.contactability * 0.25;
  if (input.hasApplicationForm) contactability += w.contactability * 0.25;
  contactability = Math.min(w.contactability, contactability);

  let catalogFit = 0;
  const count = input.productCount ?? 0;
  if (count >= 20) catalogFit += w.catalogFit * 0.4;
  else if (count >= 5) catalogFit += w.catalogFit * 0.25;
  else if (count > 0) catalogFit += w.catalogFit * 0.1;

  if (input.priceMedian != null) {
    if (input.priceMedian >= input.priceBandMin && input.priceMedian <= input.priceBandMax) {
      catalogFit += w.catalogFit * 0.4;
    } else {
      catalogFit += w.catalogFit * 0.1;
    }
  }
  if (input.nicheMatch) catalogFit += w.catalogFit * 0.2;
  catalogFit = Math.min(w.catalogFit, catalogFit);

  let legitimacy = 0;
  if ((input.domainAgeYears ?? 0) >= 2) legitimacy += w.legitimacy * 0.4;
  else if ((input.domainAgeYears ?? 0) >= 0.5) legitimacy += w.legitimacy * 0.2;
  if (input.hasPolicies) legitimacy += w.legitimacy * 0.3;
  if (input.recentActivity) legitimacy += w.legitimacy * 0.3;
  legitimacy = Math.min(w.legitimacy, legitimacy);

  let penalties = 0;
  const neg = input.evidence.filter((e) => e.type === "negative").length;
  if (neg > 0) penalties -= Math.min(25, neg * 15);
  if (input.blocked) penalties -= 30;
  if (input.marketplaceOnly) penalties -= 40;

  const raw =
    dropshipEvidence + usConfidence + contactability + catalogFit + legitimacy + penalties;
  const total = Math.max(0, Math.min(100, Math.round(raw)));

  let tier: ScoreBreakdown["tier"] = "D";
  if (total >= 80) tier = "A";
  else if (total >= 60) tier = "B";
  else if (total >= 40) tier = "C";

  return {
    dropshipEvidence: Math.round(dropshipEvidence * 10) / 10,
    usConfidence: Math.round(usConfidence * 10) / 10,
    contactability: Math.round(contactability * 10) / 10,
    catalogFit: Math.round(catalogFit * 10) / 10,
    legitimacy: Math.round(legitimacy * 10) / 10,
    penalties,
    total,
    tier,
    components: {
      dropshipEvidence: Math.round(dropshipEvidence * 10) / 10,
      usConfidence: Math.round(usConfidence * 10) / 10,
      contactability: Math.round(contactability * 10) / 10,
      catalogFit: Math.round(catalogFit * 10) / 10,
      legitimacy: Math.round(legitimacy * 10) / 10,
      penalties,
    },
  };
}
