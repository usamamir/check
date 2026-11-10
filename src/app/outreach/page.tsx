"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

type Template = { id: string; name: string; subject: string; body: string; kind?: string };
type Lead = { id: string; companyName?: string; domain: string; doNotContact?: boolean };

export default function OutreachPage() {
  const search = useSearchParams();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadId, setLeadId] = useState(search.get("lead") || "");
  const [templateId, setTemplateId] = useState("");
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [emailId, setEmailId] = useState<string | null>(null);
  const [mailto, setMailto] = useState<string | null>(null);
  const [gate, setGate] = useState<{ ok: boolean; remaining?: number; reason?: string }>({ ok: true });
  const [followups, setFollowups] = useState<Lead[]>([]);

  useEffect(() => {
    void Promise.all([
      fetch("/api/templates").then((r) => r.json()),
      fetch("/api/leads").then((r) => r.json()),
      fetch("/api/outreach").then((r) => r.json()),
      fetch("/api/dashboard").then((r) => r.json()),
    ]).then(([tpl, leadData, outreach, dash]) => {
      setTemplates(tpl.templates || []);
      if (tpl.templates?.[0]) setTemplateId(tpl.templates[0].id);
      setLeads(leadData.leads || []);
      setGate(outreach.sendGate || { ok: true });
      setFollowups(dash.followups || []);
    });
  }, []);

  async function generateDraft() {
    if (!leadId || !templateId) {
      toast.error("Pick a lead and template");
      return;
    }
    const res = await fetch("/api/outreach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "draft", leadId, templateId }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Failed");
      return;
    }
    setEmailId(data.id);
    setTo(data.to || "");
    setSubject(data.subject || "");
    setBody(data.body || "");
    setMailto(data.mailto || null);
    toast.success("Draft generated");
  }

  async function sendSmtp() {
    if (!emailId) {
      toast.error("Generate a draft first");
      return;
    }
    const res = await fetch("/api/outreach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "send", emailId }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Send failed");
      return;
    }
    toast.success("Email sent via SMTP");
  }

  function copyDraft() {
    void navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    toast.success("Copied to clipboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Outreach</h1>
        <p className="text-sm text-muted-foreground">
          Drafts only by default. One-by-one SMTP send respects the daily cap. CAN-SPAM footer comes from Settings.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Generate draft</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Lead</Label>
                <select className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={leadId} onChange={(e) => setLeadId(e.target.value)}>
                  <option value="">Select lead…</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id} disabled={Boolean(l.doNotContact)}>
                      {l.companyName || l.domain}{l.doNotContact ? " (DNC)" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Template</Label>
                <select className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <Button onClick={generateDraft}>Generate draft</Button>

            <div className="space-y-2">
              <Label>To</Label>
              <Input value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Body</Label>
              <Textarea rows={14} value={body} onChange={(e) => setBody(e.target.value)} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={copyDraft} disabled={!body}>Copy</Button>
              {mailto && (
                <Button variant="outline" asChild>
                  <a href={mailto}>Open in email client</a>
                </Button>
              )}
              <Button onClick={sendSmtp} disabled={!emailId || !gate.ok}>
                Send via SMTP {gate.remaining != null ? `(${gate.remaining} left today)` : ""}
              </Button>
            </div>
            {!gate.ok && <p className="text-sm text-amber-700 dark:text-amber-300">{gate.reason}</p>}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Follow up today</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {followups.length === 0 && <p className="text-sm text-muted-foreground">Nothing due.</p>}
              {followups.map((l) => (
                <button
                  key={l.id}
                  className="flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm hover:bg-muted/40"
                  onClick={() => {
                    setLeadId(l.id);
                    const follow = templates.find((t) => t.kind === "followup");
                    if (follow) setTemplateId(follow.id);
                  }}
                >
                  <span>{l.companyName || l.domain}</span>
                  <Badge variant="warning">Due</Badge>
                </button>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Templates</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {templates.map((t) => (
                <div key={t.id} className="rounded-md border px-3 py-2">
                  <div className="font-medium">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.kind}</div>
                </div>
              ))}
              <p className="text-xs text-muted-foreground">
                Variables: {"{{company}}"}, {"{{ownerFirstName}}"}, {"{{niche}}"}, {"{{myStoreName}}"}, {"{{myMarketplaces}}"}, {"{{productExample}}"}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
