"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { setTheme } from "@/components/layout/theme-provider";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [secretEdits, setSecretEdits] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then(setSettings);
  }, []);

  function set(key: string, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    const payload = { ...settings, ...secretEdits };
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      toast.error("Save failed");
      return;
    }
    toast.success("Settings saved");
    setSecretEdits({});
    const refreshed = await fetch("/api/settings").then((r) => r.json());
    setSettings(refreshed);
  }

  async function downloadBackup() {
    const res = await fetch("/api/backup");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "supplyscout-backup.db";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function restoreBackup(file: File) {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/backup", { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok) toast.error(data.error || "Restore failed");
    else toast.success(data.message || "Restored");
  }

  const secretField = (key: string, label: string) => (
    <div className="space-y-2" key={key}>
      <Label>{label}</Label>
      <Input
        type="password"
        placeholder={settings[`${key}__set`] ? "•••• saved — type to replace" : "Not set"}
        value={secretEdits[key] ?? ""}
        onChange={(e) => setSecretEdits((p) => ({ ...p, [key]: e.target.value }))}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">API keys, crawl limits, scoring, business identity, backup.</p>
        </div>
        <Button onClick={save}>Save settings</Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Search APIs</CardTitle>
            <CardDescription>Official APIs only — never scrapes Google/Bing HTML.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {secretField("brave_search_api_key", "Brave Search API key")}
            {secretField("serpapi_api_key", "SerpAPI key")}
            {secretField("google_cse_api_key", "Google CSE API key")}
            <div className="space-y-2">
              <Label>Google CSE CX</Label>
              <Input value={settings.google_cse_cx || ""} onChange={(e) => set("google_cse_cx", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Optional LLM</CardTitle>
            <CardDescription>App works without this via rule-based scoring.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>Provider</Label>
              <select
                className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                value={settings.llm_provider || "openai"}
                onChange={(e) => set("llm_provider", e.target.value)}
              >
                <option value="openai">OpenAI-compatible</option>
                <option value="anthropic">Anthropic</option>
              </select>
            </div>
            {secretField("llm_api_key", "LLM API key")}
            <div className="space-y-2">
              <Label>Base URL (optional)</Label>
              <Input value={settings.llm_base_url || ""} onChange={(e) => set("llm_base_url", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Model</Label>
              <Input value={settings.llm_model || ""} onChange={(e) => set("llm_model", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Crawl & jobs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>User-Agent contact</Label>
              <Input
                value={settings.user_agent_contact || ""}
                onChange={(e) => set("user_agent_contact", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                UA becomes: SupplyScoutBot/1.0 (+contact: …)
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Max pages/domain</Label>
                <Input value={settings.crawl_max_pages || "25"} onChange={(e) => set("crawl_max_pages", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Req/sec/domain</Label>
                <Input value={settings.crawl_rate_per_sec || "1"} onChange={(e) => set("crawl_rate_per_sec", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Job concurrency</Label>
                <Input value={settings.job_concurrency || "2"} onChange={(e) => set("job_concurrency", e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Domain blocklist (JSON array)</Label>
              <Textarea rows={5} value={settings.domain_blocklist || "[]"} onChange={(e) => set("domain_blocklist", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Score weights (JSON)</Label>
              <Textarea rows={4} value={settings.score_weights || "{}"} onChange={(e) => set("score_weights", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Business / CAN-SPAM</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>Business name</Label>
              <Input value={settings.my_business_name || ""} onChange={(e) => set("my_business_name", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Store name</Label>
              <Input value={settings.my_store_name || ""} onChange={(e) => set("my_store_name", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Physical address</Label>
              <Input value={settings.my_physical_address || ""} onChange={(e) => set("my_physical_address", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Marketplaces</Label>
              <Input value={settings.my_marketplaces || ""} onChange={(e) => set("my_marketplaces", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Opt-out line</Label>
              <Input value={settings.my_opt_out_line || ""} onChange={(e) => set("my_opt_out_line", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Daily email cap</Label>
                <Input value={settings.daily_email_cap || "30"} onChange={(e) => set("daily_email_cap", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Follow-up days</Label>
                <Input value={settings.followup_days || "5"} onChange={(e) => set("followup_days", e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">SMTP (optional send)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>Host</Label>
              <Input value={settings.smtp_host || ""} onChange={(e) => set("smtp_host", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Port</Label>
                <Input value={settings.smtp_port || "587"} onChange={(e) => set("smtp_port", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>From</Label>
                <Input value={settings.smtp_from || ""} onChange={(e) => set("smtp_from", e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>User</Label>
              <Input value={settings.smtp_user || ""} onChange={(e) => set("smtp_user", e.target.value)} />
            </div>
            {secretField("smtp_pass", "Password / app password")}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Appearance & backup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setTheme("light")}>Light</Button>
              <Button variant="outline" onClick={() => setTheme("dark")}>Dark</Button>
              <Button variant="outline" onClick={() => setTheme("system")}>System</Button>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button variant="outline" onClick={downloadBackup}>Download SQLite backup</Button>
              <label className="inline-flex h-9 cursor-pointer items-center rounded-md border px-4 text-sm hover:bg-accent">
                Restore backup
                <input
                  type="file"
                  accept=".db,application/octet-stream"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void restoreBackup(f);
                  }}
                />
              </label>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
