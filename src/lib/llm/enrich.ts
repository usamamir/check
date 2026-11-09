import { z } from "zod";
import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { getDb } from "@/lib/db";
import { llmCache } from "@/lib/db/schema";
import { getSetting } from "@/lib/db/settings";
import { hashText } from "@/lib/utils";
import type { DropshipEvidence } from "@/lib/extractors/dropship";

const LlmResultSchema = z.object({
  dropshipStatus: z.enum(["yes", "likely", "wholesale_only", "no", "unknown"]),
  evidence: z.array(z.string()).optional(),
  requirements: z
    .object({
      minOrder: z.string().optional(),
      fees: z.string().optional(),
      resellerPermitNeeded: z.boolean().optional(),
      map: z.string().optional(),
    })
    .optional(),
  summary: z.string().optional(),
  ownerName: z.string().optional(),
  ownerRole: z.string().optional(),
});

export type LlmEnrichResult = z.infer<typeof LlmResultSchema>;

export async function maybeLlmEnrich(opts: {
  domain: string;
  text: string;
  evidence: DropshipEvidence[];
}): Promise<LlmEnrichResult | null> {
  const apiKey = getSetting("llm_api_key") || process.env.LLM_API_KEY;
  if (!apiKey) return null;

  const pageHash = hashText(`${opts.domain}:${opts.text.slice(0, 4000)}`);
  const db = getDb();
  const cached = db.select().from(llmCache).where(eq(llmCache.pageHash, pageHash)).get();
  if (cached) {
    try {
      return LlmResultSchema.parse(JSON.parse(cached.result));
    } catch {
      // continue
    }
  }

  const provider = getSetting("llm_provider", "openai") || "openai";
  const model = getSetting("llm_model", "gpt-4o-mini") || "gpt-4o-mini";
  const baseUrl =
    getSetting("llm_base_url") ||
    (provider === "anthropic" ? "https://api.anthropic.com" : "https://api.openai.com/v1");

  const prompt = `Classify this US business for dropshipping suitability. Return ONLY JSON matching:
{"dropshipStatus":"yes"|"likely"|"wholesale_only"|"no"|"unknown","evidence":string[],"requirements":{"minOrder"?:string,"fees"?:string,"resellerPermitNeeded"?:boolean,"map"?:string},"summary":string,"ownerName"?:string,"ownerRole"?:string}

Domain: ${opts.domain}
Rule evidence phrases: ${opts.evidence.map((e) => e.phrase).join(", ")}
Page text:
${opts.text.slice(0, 10000)}`;

  try {
    let content = "";
    if (provider === "anthropic") {
      const res = await fetch(`${baseUrl.replace(/\/$/, "")}/v1/messages`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: 800,
          messages: [{ role: "user", content: prompt }],
        }),
        signal: AbortSignal.timeout(45000),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { content?: Array<{ text?: string }> };
      content = data.content?.[0]?.text || "";
    } else {
      const res = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: "You extract structured JSON about dropship policies." },
            { role: "user", content: prompt },
          ],
        }),
        signal: AbortSignal.timeout(45000),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      content = data.choices?.[0]?.message?.content || "";
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = LlmResultSchema.parse(JSON.parse(jsonMatch[0]));
    db.insert(llmCache)
      .values({
        id: uuid(),
        pageHash,
        result: JSON.stringify(parsed),
        createdAt: Date.now(),
      })
      .run();
    return parsed;
  } catch {
    return null;
  }
}
