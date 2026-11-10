import { eq } from "drizzle-orm";
import { settings, templates } from "./schema";
import { DEFAULT_SETTINGS, DEFAULT_TEMPLATES } from "./defaults";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type * as schema from "./schema";

type Db = BetterSQLite3Database<typeof schema>;

export function seedDefaults(db: Db) {
  const now = Date.now();

  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    const existing = db.select().from(settings).where(eq(settings.key, key)).get();
    if (!existing) {
      const envMap: Record<string, string | undefined> = {
        brave_search_api_key: process.env.BRAVE_SEARCH_API_KEY,
        serpapi_api_key: process.env.SERPAPI_API_KEY,
        google_cse_api_key: process.env.GOOGLE_CSE_API_KEY,
        google_cse_cx: process.env.GOOGLE_CSE_CX,
        llm_provider: process.env.LLM_PROVIDER,
        llm_api_key: process.env.LLM_API_KEY,
        llm_base_url: process.env.LLM_BASE_URL,
        llm_model: process.env.LLM_MODEL,
        smtp_host: process.env.SMTP_HOST,
        smtp_port: process.env.SMTP_PORT,
        smtp_user: process.env.SMTP_USER,
        smtp_pass: process.env.SMTP_PASS,
        smtp_from: process.env.SMTP_FROM,
        user_agent_contact: process.env.USER_AGENT_CONTACT,
      };
      const fromEnv = envMap[key];
      db.insert(settings)
        .values({ key, value: fromEnv && fromEnv.length ? fromEnv : value, updatedAt: now })
        .run();
    }
  }

  for (const tpl of DEFAULT_TEMPLATES) {
    const existing = db.select().from(templates).where(eq(templates.id, tpl.id)).get();
    if (!existing) {
      db.insert(templates)
        .values({
          id: tpl.id,
          name: tpl.name,
          subject: tpl.subject,
          body: tpl.body,
          kind: tpl.kind,
          createdAt: now,
        })
        .run();
    }
  }
}
