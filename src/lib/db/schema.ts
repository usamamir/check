import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const searches = sqliteTable("searches", {
  id: text("id").primaryKey(),
  niche: text("niche").notNull(),
  keywords: text("keywords").default("[]"),
  sources: text("sources").default("[]"),
  targetCount: integer("target_count").default(50),
  status: text("status").default("pending"),
  stats: text("stats").default("{}"),
  createdAt: integer("created_at").notNull(),
});

export const jobs = sqliteTable("jobs", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  payload: text("payload").default("{}"),
  status: text("status").default("pending"),
  attempts: integer("attempts").default(0),
  error: text("error"),
  progress: text("progress").default("{}"),
  runAfter: integer("run_after"),
  searchId: text("search_id"),
  leadId: text("lead_id"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
  startedAt: integer("started_at"),
  finishedAt: integer("finished_at"),
});

export const leads = sqliteTable("leads", {
  id: text("id").primaryKey(),
  domain: text("domain").notNull().unique(),
  companyName: text("company_name"),
  description: text("description"),
  niche: text("niche"),
  categories: text("categories").default("[]"),
  platform: text("platform"),
  country: text("country"),
  state: text("state"),
  city: text("city"),
  usConfidence: real("us_confidence").default(0),
  dropshipStatus: text("dropship_status").default("unknown"),
  dropshipScore: real("dropship_score").default(0),
  score: real("score").default(0),
  tier: text("tier").default("D"),
  scoreBreakdown: text("score_breakdown").default("{}"),
  productCount: integer("product_count"),
  priceMin: real("price_min"),
  priceMedian: real("price_median"),
  priceMax: real("price_max"),
  domainAgeYears: real("domain_age_years"),
  pipelineStatus: text("pipeline_status").default("new"),
  doNotContact: integer("do_not_contact", { mode: "boolean" }).default(false),
  tags: text("tags").default("[]"),
  notes: text("notes").default(""),
  crawlError: text("crawl_error"),
  requirements: text("requirements").default("{}"),
  firstSeenAt: integer("first_seen_at").notNull(),
  lastCrawledAt: integer("last_crawled_at"),
  searchId: text("search_id"),
});

export const evidence = sqliteTable("evidence", {
  id: text("id").primaryKey(),
  leadId: text("lead_id").notNull(),
  type: text("type").notNull(),
  phrase: text("phrase").notNull(),
  snippet: text("snippet"),
  url: text("url"),
  createdAt: integer("created_at").notNull(),
});

export const contacts = sqliteTable("contacts", {
  id: text("id").primaryKey(),
  leadId: text("lead_id").notNull(),
  kind: text("kind").notNull(),
  value: text("value").notNull(),
  label: text("label"),
  personName: text("person_name"),
  personRole: text("person_role"),
  mxValid: integer("mx_valid", { mode: "boolean" }),
  sourceUrl: text("source_url"),
  confidence: real("confidence").default(0.5),
  createdAt: integer("created_at").notNull(),
});

export const pages = sqliteTable("pages", {
  id: text("id").primaryKey(),
  leadId: text("lead_id").notNull(),
  url: text("url").notNull(),
  title: text("title"),
  httpStatus: integer("http_status"),
  contentHash: text("content_hash"),
  cleanedText: text("cleaned_text"),
  fetchedAt: integer("fetched_at").notNull(),
});

export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  leadId: text("lead_id").notNull(),
  title: text("title").notNull(),
  price: real("price"),
  url: text("url"),
  image: text("image"),
  vendor: text("vendor"),
  type: text("type"),
});

export const activities = sqliteTable("activities", {
  id: text("id").primaryKey(),
  leadId: text("lead_id").notNull(),
  type: text("type").notNull(),
  body: text("body").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const templates = sqliteTable("templates", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  kind: text("kind").default("initial"),
  createdAt: integer("created_at").notNull(),
});

export const emails = sqliteTable("emails", {
  id: text("id").primaryKey(),
  leadId: text("lead_id").notNull(),
  templateId: text("template_id"),
  to: text("to").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  status: text("status").default("draft"),
  sentAt: integer("sent_at"),
  createdAt: integer("created_at").notNull(),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const llmCache = sqliteTable("llm_cache", {
  id: text("id").primaryKey(),
  pageHash: text("page_hash").notNull().unique(),
  result: text("result").notNull(),
  createdAt: integer("created_at").notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type Job = typeof jobs.$inferSelect;
export type Contact = typeof contacts.$inferSelect;
export type Evidence = typeof evidence.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type Template = typeof templates.$inferSelect;
export type Email = typeof emails.$inferSelect;
export type Search = typeof searches.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Page = typeof pages.$inferSelect;
