import { getUserAgent } from "@/lib/db/settings";
import { isUrlAllowed } from "./robots";
import { sleep } from "@/lib/utils";

export type FetchResult = {
  url: string;
  finalUrl: string;
  status: number;
  html: string;
  headers: Record<string, string>;
  blocked?: boolean;
  error?: string;
  via: "http" | "playwright";
};

type BrowserLike = {
  newPage: (opts?: { userAgent?: string }) => Promise<{
    goto: (url: string, opts: { waitUntil: string; timeout: number }) => Promise<{ status: () => number } | null>;
    content: () => Promise<string>;
    url: () => string;
    close: () => Promise<void>;
  }>;
  close: () => Promise<void>;
};

const lastRequestAt = new Map<string, number>();
let browserPromise: Promise<BrowserLike> | null = null;
let playwrightUnavailable = false;

async function getBrowser(): Promise<BrowserLike | null> {
  if (playwrightUnavailable) return null;
  if (!browserPromise) {
    browserPromise = (async () => {
      try {
        const { chromium } = await import("playwright");
        return (await chromium.launch({ headless: true })) as unknown as BrowserLike;
      } catch (err) {
        playwrightUnavailable = true;
        browserPromise = null;
        console.warn(
          "[crawler] Playwright unavailable — using HTTP/Cheerio only:",
          err instanceof Error ? err.message : err
        );
        return null as unknown as BrowserLike;
      }
    })();
  }
  const browser = await browserPromise;
  return browser || null;
}

export async function closeBrowser() {
  if (browserPromise) {
    try {
      const b = await browserPromise;
      if (b) await b.close().catch(() => undefined);
    } catch {
      // ignore
    }
    browserPromise = null;
  }
}

async function respectRateLimit(hostname: string, ratePerSec: number) {
  const minGap = Math.ceil(1000 / Math.max(0.1, ratePerSec));
  const last = lastRequestAt.get(hostname) ?? 0;
  const wait = minGap - (Date.now() - last);
  if (wait > 0) await sleep(wait);
  lastRequestAt.set(hostname, Date.now());
}

function looksBlocked(status: number, html: string): boolean {
  if ([401, 403, 429, 503].includes(status)) return true;
  const lower = html.toLowerCase();
  return (
    lower.includes("cf-browser-verification") ||
    lower.includes("attention required! | cloudflare") ||
    lower.includes("checking your browser before accessing") ||
    (lower.includes("access denied") && lower.includes("cloudflare"))
  );
}

function needsPlaywright(html: string): boolean {
  const text = html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "");
  const visible = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return visible.length < 200 && /__next|react|ng-app|data-reactroot/i.test(html);
}

export async function fetchPage(
  url: string,
  opts: { ratePerSec?: number; timeoutMs?: number; forcePlaywright?: boolean } = {}
): Promise<FetchResult> {
  const rate = opts.ratePerSec ?? 1;
  const timeoutMs = opts.timeoutMs ?? 20000;
  const ua = getUserAgent();

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return {
      url,
      finalUrl: url,
      status: 0,
      html: "",
      headers: {},
      error: "Invalid URL",
      via: "http",
    };
  }

  const allowed = await isUrlAllowed(url);
  if (!allowed) {
    return {
      url,
      finalUrl: url,
      status: 0,
      html: "",
      headers: {},
      error: "Blocked by robots.txt",
      via: "http",
    };
  }

  await respectRateLimit(parsed.hostname, rate);

  let httpHtml = "";
  let httpStatus = 0;
  let httpFinal = url;
  let httpHeaders: Record<string, string> = {};

  if (!opts.forcePlaywright) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": ua,
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "en-US,en;q=0.9",
        },
        redirect: "follow",
        signal: AbortSignal.timeout(timeoutMs),
      });
      const html = await res.text();
      const headers: Record<string, string> = {};
      res.headers.forEach((v, k) => {
        headers[k] = v;
      });
      httpHtml = html;
      httpStatus = res.status;
      httpFinal = res.url;
      httpHeaders = headers;

      if (looksBlocked(res.status, html)) {
        return {
          url,
          finalUrl: res.url,
          status: res.status,
          html,
          headers,
          blocked: true,
          error: "Blocked or challenged (Cloudflare/bot protection) — manual review",
          via: "http",
        };
      }

      if (!needsPlaywright(html)) {
        return {
          url,
          finalUrl: res.url,
          status: res.status,
          html,
          headers,
          via: "http",
        };
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/certificate|SSL|UNABLE_TO_VERIFY/i.test(msg)) {
        return {
          url,
          finalUrl: url,
          status: 0,
          html: "",
          headers: {},
          error: `SSL error: ${msg}`,
          via: "http",
        };
      }
      // fall through to playwright
    }
  }

  // Playwright fallback (optional — skipped if unavailable in packaged builds)
  try {
    await respectRateLimit(parsed.hostname, rate);
    const browser = await getBrowser();
    if (!browser) {
      if (httpHtml) {
        return {
          url,
          finalUrl: httpFinal,
          status: httpStatus,
          html: httpHtml,
          headers: httpHeaders,
          via: "http",
        };
      }
      return {
        url,
        finalUrl: url,
        status: 0,
        html: "",
        headers: {},
        error: "Playwright unavailable and HTTP fetch failed",
        via: "http",
      };
    }

    const page = await browser.newPage({ userAgent: ua });
    try {
      const response = await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: timeoutMs,
      });
      const html = await page.content();
      const status = response?.status() ?? 0;
      const finalUrl = page.url();
      if (looksBlocked(status, html)) {
        return {
          url,
          finalUrl,
          status,
          html,
          headers: {},
          blocked: true,
          error: "Blocked or challenged — manual review",
          via: "playwright",
        };
      }
      return { url, finalUrl, status, html, headers: {}, via: "playwright" };
    } finally {
      await page.close().catch(() => undefined);
    }
  } catch (err) {
    if (httpHtml) {
      return {
        url,
        finalUrl: httpFinal,
        status: httpStatus,
        html: httpHtml,
        headers: httpHeaders,
        via: "http",
      };
    }
    return {
      url,
      finalUrl: url,
      status: 0,
      html: "",
      headers: {},
      error: err instanceof Error ? err.message : String(err),
      via: "playwright",
    };
  }
}

export async function fetchJson<T = unknown>(
  url: string,
  ratePerSec = 1
): Promise<{ ok: boolean; status: number; data?: T; error?: string }> {
  try {
    const parsed = new URL(url);
    await respectRateLimit(parsed.hostname, ratePerSec);
    const res = await fetch(url, {
      headers: { "User-Agent": getUserAgent(), Accept: "application/json" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return { ok: false, status: res.status, error: `HTTP ${res.status}` };
    const data = (await res.json()) as T;
    return { ok: true, status: res.status, data };
  } catch (err) {
    return { ok: false, status: 0, error: err instanceof Error ? err.message : String(err) };
  }
}
