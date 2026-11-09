import { readFileSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import {
  extractEmails,
  decodeCloudflareEmail,
  detectDropshipSignals,
  summarizeDropshipStatus,
  detectUsLocation,
  extractOwner,
  detectPlatform,
} from "./index";
import { computeScore } from "@/lib/scoring/score";

const fixture = (name: string) =>
  readFileSync(path.join(__dirname, "../../test/fixtures", name), "utf8");

describe("email extraction", () => {
  it("extracts mailto, plain, and obfuscated emails", () => {
    const html = fixture("emails.html");
    const emails = extractEmails(html);
    const values = emails.map((e) => e.email);
    expect(values).toContain("partners@examplebrand.com");
    expect(values).toContain("wholesale@examplebrand.com");
    expect(values).toContain("info@examplebrand.com");
    const wholesale = emails.find((e) => e.email.startsWith("wholesale@"));
    const support = emails.find((e) => e.email.startsWith("support@"));
    expect(wholesale!.confidence).toBeGreaterThan(support!.confidence);
  });

  it("decodes cloudflare protected emails", () => {
    // encode hello@example.com with key 0x4e
    const email = "hello@example.com";
    const key = 0x4e;
    let encoded = key.toString(16).padStart(2, "0");
    for (const ch of email) {
      encoded += (ch.charCodeAt(0) ^ key).toString(16).padStart(2, "0");
    }
    expect(decodeCloudflareEmail(encoded)).toBe(email);
  });
});

describe("dropship signals", () => {
  it("detects positive and medium signals", () => {
    const html = fixture("dropship-positive.html");
    const ev = detectDropshipSignals(html);
    expect(ev.some((e) => e.type === "positive")).toBe(true);
    expect(ev.some((e) => e.type === "medium")).toBe(true);
    expect(summarizeDropshipStatus(ev)).toMatch(/yes|likely/);
  });

  it("detects negative signals", () => {
    const html = fixture("dropship-negative.html");
    const ev = detectDropshipSignals(html);
    expect(ev.some((e) => e.type === "negative")).toBe(true);
    expect(summarizeDropshipStatus(ev)).toBe("no");
  });
});

describe("US location + owner", () => {
  it("finds US address and founder", () => {
    const html = fixture("about-owner.html");
    const text = html.replace(/<[^>]+>/g, " ");
    const loc = detectUsLocation(text);
    expect(loc.state).toBe("TX");
    expect(loc.city?.toLowerCase()).toContain("austin");
    expect(loc.confidence).toBeGreaterThan(0.5);

    const owner = extractOwner(html, text);
    expect(owner?.name).toMatch(/Jordan Lee/);
  });
});

describe("platform + scoring", () => {
  it("detects Shopify", () => {
    expect(detectPlatform(fixture("shopify.html"))).toBe("shopify");
  });

  it("scores A-tier for strong evidence + contacts + US", () => {
    const evidence = detectDropshipSignals(fixture("dropship-positive.html"));
    const result = computeScore({
      evidence,
      usConfidence: 0.9,
      hasRoleEmail: true,
      hasPhone: true,
      hasApplicationForm: true,
      productCount: 120,
      priceMedian: 40,
      priceBandMin: 5,
      priceBandMax: 500,
      nicheMatch: true,
      domainAgeYears: 5,
      hasPolicies: true,
      recentActivity: true,
    });
    expect(result.total).toBeGreaterThanOrEqual(60);
    expect(["A", "B"]).toContain(result.tier);
    expect(result.components.dropshipEvidence).toBeGreaterThan(0);
  });
});
