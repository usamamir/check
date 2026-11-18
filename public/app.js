const profileEl = document.querySelector("#profile");
const sheetEl = document.querySelector("#sheet");
const letterEl = document.querySelector("#letter");
const letterPanel = document.querySelector("#letter-panel");
const banner = document.querySelector("#banner");
const runmeta = document.querySelector("#runmeta");
const notice = document.querySelector("#notice");
const extraInput = document.querySelector("#extra");
const resumeInput = document.querySelector("#resume-text");
const runButton = document.querySelector("#run");

let state = null;
let selectedId = null;

document.querySelector("#today").textContent = new Date().toLocaleDateString(undefined, {
  weekday: "long",
  month: "long",
  day: "numeric",
});

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[char]));
}

function statusLabel(status) {
  return { new: "New", draft: "Draft", saved: "Saved", applied: "Applied", skipped: "Skipped" }[status] || status;
}

function shortDate(value) {
  if (!value) return "No date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No date";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

async function api(path, options) {
  const response = await fetch(path, options);
  const type = response.headers.get("content-type") || "";
  const data = type.includes("json") ? await response.json() : null;
  if (!response.ok) throw new Error(data?.error || `Request failed (${response.status})`);
  return data;
}

function say(message) {
  notice.textContent = message || "";
}

function renderProfile() {
  const profile = state.profile;
  const years = profile.years ? `${profile.years} years stated` : "Years not stated";
  const contact = [profile.email, profile.phone].filter(Boolean).join(" · ");
  const skills = profile.skills || [];
  profileEl.innerHTML = `
    <p class="who">${esc(profile.name || "Name not found")}</p>
    <p class="years">${esc(years)}${contact ? ` · ${esc(contact)}` : ""}</p>
    <ul class="chips">${skills.map((skill) => `<li>${esc(skill)}</li>`).join("") || "<li>No skills picked out yet</li>"}</ul>
    <p class="quiet">Search string. Paste it into Google and set the date to the past 3 days if you want to look there yourself.</p>
    <pre class="query" id="query">${esc(profile.query || "Paste a resume to build a search string.")}</pre>
    <button class="secondary" type="button" id="copy-query">Copy search string</button>
  `;
  banner.hidden = !profile.sample;
  if (profile.sample) {
    banner.textContent = "Starter profile only: 11 years, Shopify, Amazon Seller Central, and n8n. Paste the real resume before you use a letter.";
  }
  if (document.activeElement !== extraInput) extraInput.value = (profile.extraTerms || []).join(", ");
  if (document.activeElement !== resumeInput) resumeInput.value = profile.rawText || "";
}

function renderRun() {
  const run = state.lastRun;
  if (!run) {
    runmeta.textContent = "No pass yet.";
    return;
  }
  const when = new Date(run.at).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  const windowText = run.windowDays === 3 ? "last 3 days" : "last 14 days, because the 3-day window was thin";
  const sources = (run.sources || [])
    .map((source) => (source.error ? `${source.name} failed` : `${source.name} ${source.count}`))
    .join(" · ");
  const problems = (run.errors || []).length ? ` ${(run.errors || []).join(" ")}` : "";
  runmeta.textContent = `${when}: ${run.kept} matching roles from the ${windowText}. ${run.added} new. ${run.drafted} drafts written. ${sources}.${problems}`;
}

function renderSheet() {
  const jobs = state.jobs || [];
  if (!jobs.length) {
    sheetEl.innerHTML = `<p class="empty">The sheet is empty. Run a pass, or paste a posting below.</p>`;
    return;
  }
  sheetEl.innerHTML = jobs.map((job) => `
    <article class="row${job.id === selectedId ? " is-open" : ""}">
      <div class="score${job.matchScore >= 50 ? " high" : ""}">${esc(job.matchScore)}</div>
      <div>
        <button class="title-button" type="button" data-action="open" data-id="${esc(job.id)}">${esc(job.title)}</button>
        <p class="meta">${esc(job.company)} · ${esc(job.location || "Location not listed")} · ${esc(shortDate(job.postedAt))} · ${esc(job.source)}</p>
        <p class="summary">${esc(job.summary || "")}</p>
        <p class="meta">${job.contactEmail ? esc(job.contactEmail) : "No email on the posting"}${job.contactName ? ` · ${esc(job.contactName)}` : ""} · ${esc(statusLabel(job.status))}</p>
      </div>
    </article>
  `).join("");
}

function renderLetter() {
  const job = (state.jobs || []).find((item) => item.id === selectedId);
  if (!job) {
    letterPanel.hidden = true;
    letterEl.innerHTML = "";
    return;
  }
  letterPanel.hidden = false;
  const matched = (job.matchedTerms || []).join(", ");
  const safeUrl = /^https?:\/\//i.test(job.url || "") ? job.url : "";
  letterEl.innerHTML = `
    <p class="letter-meta"><strong>${esc(job.company)}</strong> · ${esc(job.title)}</p>
    <p class="meta">${job.contactEmail ? `To: ${esc(job.contactEmail)}` : "No email was listed. The draft leaves To blank."}${job.contactName ? ` · ${esc(job.contactName)}` : ""}</p>
    <p class="meta">Matched: ${esc(matched || "the title")}${safeUrl ? ` · <a href="${esc(safeUrl)}">Posting</a>` : ""}</p>
    <label class="field">Cover letter
      <textarea id="letter-body">${esc(job.coverLetter || "")}</textarea>
    </label>
    <div class="letter-actions">
      <button type="button" data-action="write" data-id="${esc(job.id)}">${job.coverLetter ? "Write it again" : "Write the letter"}</button>
      <button class="secondary" type="button" data-action="save-letter" data-id="${esc(job.id)}">Save edits</button>
      <button class="secondary" type="button" data-action="copy-letter">Copy</button>
      ${job.draftFile ? `<a class="secondary" href="/api/drafts/${esc(job.id)}.eml">Download draft</a>` : ""}
    </div>
    <div class="status-row" role="group" aria-label="Status">
      ${["saved", "applied", "skipped"].map((status) => `<button class="secondary" type="button" data-action="status" data-status="${status}" data-id="${esc(job.id)}">${esc(statusLabel(status))}</button>`).join("")}
    </div>
    <details>
      <summary>Posting text</summary>
      <div class="posting">${esc(job.description || "")}</div>
    </details>
  `;
}

function render() {
  renderProfile();
  renderRun();
  renderSheet();
  renderLetter();
}

function refresh(next, message) {
  state = next;
  if (selectedId && !(state.jobs || []).some((job) => job.id === selectedId)) selectedId = null;
  render();
  if (message) say(message);
}

document.body.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  if (action === "open") {
    selectedId = button.dataset.id;
    renderSheet();
    renderLetter();
    letterPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    return;
  }
  if (action === "copy-letter") {
    const text = document.querySelector("#letter-body")?.value || "";
    await copyText(text);
    say("Letter copied.");
    return;
  }
  const id = button.dataset.id;
  try {
    if (action === "write") {
      button.disabled = true;
      await refresh(await api(`/api/jobs/${id}/letter`, { method: "POST" }), "Letter written. Review it before you send anything.");
    } else if (action === "save-letter") {
      const coverLetter = document.querySelector("#letter-body")?.value || "";
      await refresh(await api(`/api/jobs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coverLetter }),
      }), "Edits saved into the draft.");
    } else if (action === "status") {
      await refresh(await api(`/api/jobs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: button.dataset.status }),
      }), `Marked ${button.dataset.status}.`);
    }
  } catch (error) {
    say(error.message);
  }
});

profileEl.addEventListener("click", async (event) => {
  if (event.target.id !== "copy-query") return;
  await copyText(state.profile.query || "");
  say("Search string copied.");
});

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    area.remove();
  }
}

runButton.addEventListener("click", async () => {
  runButton.disabled = true;
  const label = runButton.textContent;
  runButton.textContent = "Searching feeds…";
  say("Searching open feeds.");
  try {
    await refresh(await api("/api/pass", { method: "POST" }), "Pass finished. Drafts stay on this machine.");
    if (state.jobs?.[0]) {
      selectedId = state.jobs[0].id;
      renderSheet();
      renderLetter();
    }
  } catch (error) {
    say(error.message);
  } finally {
    runButton.disabled = false;
    runButton.textContent = label;
  }
});

document.querySelector("#save-extra").addEventListener("click", async () => {
  try {
    await refresh(await api("/api/extra", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ extraTerms: extraInput.value }),
    }), "Search string updated.");
  } catch (error) {
    say(error.message);
  }
});

document.querySelector("#use-text").addEventListener("click", async () => {
  try {
    await refresh(await api("/api/resume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: resumeInput.value }),
    }), "Resume updated.");
  } catch (error) {
    say(error.message);
  }
});

document.querySelector("#resume-file").addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;
  const type = /pdf$/i.test(file.name) || file.type.includes("pdf") ? "application/pdf" : "text/plain";
  say("Reading the resume…");
  try {
    await refresh(await api("/api/resume/file", {
      method: "POST",
      headers: { "Content-Type": type },
      body: await file.arrayBuffer(),
    }), "Resume updated.");
  } catch (error) {
    say(error.message);
  }
});

document.querySelector("#paste-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const body = Object.fromEntries(new FormData(form).entries());
  const submit = form.querySelector("button[type=submit]");
  submit.disabled = true;
  try {
    await refresh(await api("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }), "Posting added. The letter is a draft, not an email.");
    const newest = (state.jobs || [])
      .filter((job) => job.source === "Pasted" && job.title === String(body.title || "").trim())
      .sort((a, b) => String(b.firstSeenAt).localeCompare(String(a.firstSeenAt)))[0];
    if (newest) selectedId = newest.id;
    renderSheet();
    renderLetter();
    form.reset();
  } catch (error) {
    say(error.message);
  } finally {
    submit.disabled = false;
  }
});

api("/api/state").then((next) => refresh(next)).catch((error) => say(error.message));
