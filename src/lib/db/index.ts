import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import fs from "fs";
import path from "path";
import * as schema from "./schema";
import { seedDefaults } from "./seed";

const globalForDb = globalThis as unknown as {
  __supplyscoutDb?: ReturnType<typeof createDb>;
};

function dbPath() {
  const dir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, "supplyscout.db");
}

function migrate(sqlite: Database.Database) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS searches (
      id TEXT PRIMARY KEY,
      niche TEXT NOT NULL,
      keywords TEXT DEFAULT '[]',
      sources TEXT DEFAULT '[]',
      target_count INTEGER DEFAULT 50,
      status TEXT DEFAULT 'pending',
      stats TEXT DEFAULT '{}',
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      payload TEXT DEFAULT '{}',
      status TEXT DEFAULT 'pending',
      attempts INTEGER DEFAULT 0,
      error TEXT,
      progress TEXT DEFAULT '{}',
      run_after INTEGER,
      search_id TEXT,
      lead_id TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      started_at INTEGER,
      finished_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      domain TEXT NOT NULL UNIQUE,
      company_name TEXT,
      description TEXT,
      niche TEXT,
      categories TEXT DEFAULT '[]',
      platform TEXT,
      country TEXT,
      state TEXT,
      city TEXT,
      us_confidence REAL DEFAULT 0,
      dropship_status TEXT DEFAULT 'unknown',
      dropship_score REAL DEFAULT 0,
      score REAL DEFAULT 0,
      tier TEXT DEFAULT 'D',
      score_breakdown TEXT DEFAULT '{}',
      product_count INTEGER,
      price_min REAL,
      price_median REAL,
      price_max REAL,
      domain_age_years REAL,
      pipeline_status TEXT DEFAULT 'new',
      do_not_contact INTEGER DEFAULT 0,
      tags TEXT DEFAULT '[]',
      notes TEXT DEFAULT '',
      crawl_error TEXT,
      requirements TEXT DEFAULT '{}',
      first_seen_at INTEGER NOT NULL,
      last_crawled_at INTEGER,
      search_id TEXT
    );
    CREATE TABLE IF NOT EXISTS evidence (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL,
      type TEXT NOT NULL,
      phrase TEXT NOT NULL,
      snippet TEXT,
      url TEXT,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL,
      kind TEXT NOT NULL,
      value TEXT NOT NULL,
      label TEXT,
      person_name TEXT,
      person_role TEXT,
      mx_valid INTEGER,
      source_url TEXT,
      confidence REAL DEFAULT 0.5,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS pages (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL,
      url TEXT NOT NULL,
      title TEXT,
      http_status INTEGER,
      content_hash TEXT,
      cleaned_text TEXT,
      fetched_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL,
      title TEXT NOT NULL,
      price REAL,
      url TEXT,
      image TEXT,
      vendor TEXT,
      type TEXT
    );
    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL,
      type TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      kind TEXT DEFAULT 'initial',
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS emails (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL,
      template_id TEXT,
      "to" TEXT NOT NULL,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      status TEXT DEFAULT 'draft',
      sent_at INTEGER,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS llm_cache (
      id TEXT PRIMARY KEY,
      page_hash TEXT NOT NULL UNIQUE,
      result TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(score);
    CREATE INDEX IF NOT EXISTS idx_leads_pipeline ON leads(pipeline_status);
    CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
    CREATE INDEX IF NOT EXISTS idx_evidence_lead ON evidence(lead_id);
    CREATE INDEX IF NOT EXISTS idx_contacts_lead ON contacts(lead_id);
  `);
}

function createDb() {
  const sqlite = new Database(dbPath());
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  migrate(sqlite);
  const db = drizzle(sqlite, { schema });
  seedDefaults(db);
  return { db, sqlite };
}

export function getDb() {
  if (!globalForDb.__supplyscoutDb) {
    globalForDb.__supplyscoutDb = createDb();
  }
  return globalForDb.__supplyscoutDb.db;
}

export function getSqlite() {
  if (!globalForDb.__supplyscoutDb) {
    globalForDb.__supplyscoutDb = createDb();
  }
  return globalForDb.__supplyscoutDb.sqlite;
}

export type AppDb = ReturnType<typeof getDb>;
