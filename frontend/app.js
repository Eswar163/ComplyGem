/* ============================================================
   ComplyGeM — Frontend Application
   Vanilla JS SPA · talks to the FastAPI backend only
   ============================================================ */
"use strict";

window.__errs = [];
window.addEventListener("error", e => window.__errs.push(String(e.message || e)));

const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const view = $("#view");

/* ------------------------------------------------------------------ icons */

const I = {
  grid: '<path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z"/>',
  tender: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
  bids: '<path d="M9 11l3 3 8-8"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
  files: '<path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M13 2v7h7"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>',
  report: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8"/>',
  audit: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/>',
  bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/>',
  check: '<path d="M20 6L9 17l-5-5"/>',
  x: '<path d="M18 6L6 18M6 6l12 12"/>',
  alert: '<path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  arrow: '<path d="M5 12h14M12 5l7 7-7 7"/>',
  chev: '<path d="M6 9l6 6 6-6"/>',
  refresh: '<path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.5 9a9 9 0 0 1 14.9-3.4L23 10M1 14l4.6 4.4A9 9 0 0 0 20.5 15"/>',
  printer: '<path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
  activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  layers: '<path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>',
  zap: '<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>',
  user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
  trash: '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/>',
  target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  shieldOff: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9.5 9.5l5 5M14.5 9.5l-5 5"/>',
};
function icon(name, size = 16) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[name] || I.info}</svg>`;
}

/* ------------------------------------------------------------------ helpers */

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
const fmtDateTime = iso => iso ? new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }) : "—";
const fmtDate = iso => iso ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const fmtTime = iso => iso ? new Date(iso).toLocaleTimeString("en-IN", { hour12: false }) : "—";

function timeAgo(iso) {
  if (!iso) return "—";
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} hr ago`;
  return `${Math.floor(s / 86400)} d ago`;
}

async function api(path, opts = {}) {
  const res = await fetch(path, opts);
  if (!res.ok) {
    let detail = res.statusText;
    try { detail = (await res.json()).detail || detail; } catch {}
    throw new Error(detail);
  }
  return res.json();
}

/* ------------------------------------------------------------------ toasts */

function toast(title, msg = "", kind = "ok") {
  const el = document.createElement("div");
  el.className = `toast ${kind}`;
  const ic = kind === "ok" ? "check" : kind === "err" ? "alert" : "info";
  el.innerHTML = `<span class="t-ico">${icon(ic, 15)}</span><div><b>${esc(title)}</b>${msg ? `<span>${esc(msg)}</span>` : ""}</div>`;
  $("#toasts").appendChild(el);
  setTimeout(() => { el.classList.add("out"); setTimeout(() => el.remove(), 260); }, 3600);
}

/* ------------------------------------------------------------------ skeletons */

const sk = {
  page: () => `
    <div class="sk sk-line w40"></div><div class="sk sk-line w80"></div>
    <div class="grid kpi-5 mt">${'<div class="sk sk-block"></div>'.repeat(5)}</div>
    <div class="sk sk-table"></div>`,
  table: () => `<div class="sk sk-table"></div>`,
};

/* ------------------------------------------------------------------ domain fragments */

const STATUS = {
  COMPLIANT: { chip: "ok", ic: "check", label: "Compliant" },
  NON_COMPLIANT: { chip: "bad", ic: "x", label: "Non-Compliant" },
  REVIEW_REQUIRED: { chip: "warn", ic: "alert", label: "Review Required" },
};
function statusChip(s) {
  const st = STATUS[s];
  if (!st) return `<span class="chip mut">${esc(s)}</span>`;
  return `<span class="chip ${st.chip}">${icon(st.ic, 11)} ${st.label}</span>`;
}
function verdictChip(v) {
  return {
    GOOD: '<span class="chip ok">' + icon("check", 11) + ' Good Standing</span>',
    REVIEW: '<span class="chip warn">' + icon("alert", 11) + ' Officer Review</span>',
    RISK: '<span class="chip bad">' + icon("x", 11) + ' Compliance Risk</span>',
  }[v] || `<span class="chip mut">${esc(v)}</span>`;
}
const REASON_TEXT = {
  VALUE_PASS: "Extracted value satisfies the rule",
  VALUE_FAIL: "Extracted value fails the rule",
  DOC_FOUND: "Required document located in submission",
  DOC_MISSING: "Required document not found in submission",
  VERIFIED_ACTIVE: "Verified by verification service",
  NEEDS_HUMAN: "Automatic verification inconclusive",
  NO_EXTRACTABLE_VALUE: "Value could not be extracted automatically",
  DATE_VALID: "Document validity confirmed",
  DATE_EXPIRED: "Document validity could not be confirmed",
  NO_DATE_FOUND: "No validity date found in evidence",
};

function requiredText(r) {
  if (r.req_type === "numeric" && r.threshold_value != null)
    return `${r.threshold_unit === "INR_LAKH" ? "₹" + r.threshold_value + " lakh" : "₹" + r.threshold_value + " crore"}`;
  if (r.req_type === "count" && r.threshold_value != null)
    return `≥ ${r.threshold_value} ${r.threshold_unit || "units"}`;
  if (r.req_type === "date") return "Valid through bid date";
  return "Document required";
}

function highlightSnippet(snippet, extractedValue = "") {
  let html = esc(snippet);
  const wrap = m => `<span class="hl">${m}</span>`;
  if (extractedValue) {
    const plain = extractedValue.replace(/[₹,]/g, "").trim();
    if (plain) html = html.replace(new RegExp(plain.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), wrap);
  }
  html = html.replace(/(?:₹|Rs\.?\s*)\s?[0-9][0-9,]*(?:\.[0-9]+)?\s*(?:crore|crores|lakh|lakhs|lacs)/gi, wrap);
  html = html.replace(/\b(\d{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z])\b/g, wrap);
  return html;
}

/* segmented progress bar — proportions from real results, no pie charts */
function segbarHtml(ok, warn, bad, cls = "") {
  const total = ok + warn + bad;
  if (!total) return `<div class="segbar ${cls}"></div>`;
  const seg = (n, c) => n > 0 ? `<span class="seg ${c}" style="width:${(n / total * 100).toFixed(1)}%"></span>` : "";
  return `<div class="segbar ${cls}">${seg(ok, "ok")}${seg(warn, "warn")}${seg(bad, "bad")}</div>`;
}

/* big percentage + progress bar score block */
function scoreBlock(a) {
  const total = a.n_compliant + a.n_review + a.n_non_compliant;
  return `<div class="score-block">
    <div class="sb-top"><span class="eyebrow">Compliance Score</span> ${verdictChip(a.verdict)}</div>
    <div class="sb-num" style="color:${scoreColor(a.verdict)}">${a.score}<span>%</span></div>
    <div class="sb-sub"><b>${a.n_compliant}</b> of <b>${total}</b> requirements satisfied</div>
    ${segbarHtml(a.n_compliant, a.n_review, a.n_non_compliant, "lg")}
    <div class="sb-counts">
      <span><i class="dot ok"></i> ${a.n_compliant} Compliant</span>
      <span><i class="dot warn"></i> ${a.n_review} Review</span>
      <span><i class="dot bad"></i> ${a.n_non_compliant} Non-Compliant</span>
    </div>
  </div>`;
}

const scoreColor = v => v === "GOOD" ? "var(--ok)" : v === "REVIEW" ? "#dc9a06" : "var(--bad)";

const PIPELINE_STEPS = [
  ["files", "Documents", "Tender & bid PDFs ingested"],
  ["layers", "Requirements", "Eligibility clauses extracted"],
  ["eye", "Evidence", "Relevant passages retrieved"],
  ["shield", "Verification", "GST / PAN cross-checked"],
  ["zap", "Rule Check", "Deterministic PASS / FAIL"],
  ["user", "Officer Review", "Human decision with evidence"],
];

/* ------------------------------------------------------------------ router */

let searchCache = { data: null, at: 0 };

const routes = [
  [/^#\/tender\/(\d+)$/, tenderView, "Tender", "tenders"],
  [/^#\/analysis\/(\d+)$/, analysisView, "Bid Analysis", "bids"],
  [/^#\/report\/(\d+)$/, reportView, "Compliance Report", "reports"],
  [/^#\/dashboard$/, () => { location.hash = "#/"; }, "Overview", "overview"],
  [/^#\/?$/, overviewView, "Overview", "overview"],
  [/^#\/tenders$/, tendersView, "Tenders", "tenders"],
  [/^#\/bids$/, bidsView, "Bids", "bids"],
  [/^#\/documents$/, documentsView, "Documents", "documents"],
  [/^#\/verification$/, verificationView, "Verification Services", "verification"],
  [/^#\/reports$/, reportsView, "Reports", "reports"],
  [/^#\/audit$/, auditView, "Audit Trail", "audit"],
  [/^#\/new$/, newAnalysisView, "New Analysis", "new"],
];

function setCrumb(items) {
  $("#crumb").innerHTML = items.map(([label, href], i) => {
    const last = i === items.length - 1;
    const inner = last ? `<span class="here">${esc(label)}</span>` : (href ? `<a href="${href}">${esc(label)}</a>` : esc(label));
    return (i ? '<span class="sep">›</span>' : "") + inner;
  }).join("");
}

async function route() {
  const hash = location.hash || "#/";
  for (const [re, fn, title, nav] of routes) {
    const m = hash.match(re);
    if (!m) continue;
    $$(".nav a").forEach(a => a.classList.toggle("active", a.dataset.nav === nav));
    const tenderTitle = m[1] ? await lookupTenderTitle(m[1]).catch(() => null) : null;
    const crumbs = [["ComplyGeM", "#/"]];
    if (title === "Tender" && tenderTitle) { crumbs.push(["Tenders", "#/tenders"]); crumbs.push([tenderTitle, null]); }
    else if (title === "Bid Analysis") { crumbs.push(["Bids", "#/bids"]); crumbs.push(["Bid Analysis", null]); }
    else if (title === "Compliance Report") { crumbs.push(["Reports", "#/reports"]); crumbs.push(["Report", null]); }
    else crumbs.push([title, null]);
    setCrumb(crumbs);
    document.title = `${title} · ComplyGeM`;
    try { await fn(...m.slice(1)); } catch (e) { renderError(e.message); }
    window.scrollTo(0, 0);
    refreshNavCounts();
    return;
  }
  renderError("Page not found");
}

function renderError(msg) {
  view.innerHTML = `<div class="card card-body"><h3 style="font-size:16px">Something went wrong</h3>
    <p class="muted mt-s">${esc(msg)}</p>
    <button class="btn mt" onclick="location.hash='#/'">${icon("arrow", 14)} Back to Overview</button></div>`;
}

async function lookupTenderTitle(id) {
  const t = await api(`/api/tenders/${id}`);
  return t.title;
}

async function refreshNavCounts() {
  try {
    if (!searchCache.data || Date.now() - searchCache.at > 30000) {
      searchCache.data = await api("/api/tenders");
      searchCache.at = Date.now();
    }
    $("#nav-tender-count").textContent = searchCache.data.length;
    const bids = await api("/api/analyses");
    $("#nav-bid-count").textContent = bids.length;
  } catch {}
}

/* ------------------------------------------------------------------ OVERVIEW */

async function overviewView() {
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  view.innerHTML = `
    <div class="page-head">
      <div>
        <h1>${greet}, Officer</h1>
        <div class="sub">Monitor tender compliance, verification status and bid risks.</div>
      </div>
      <div class="actions"><button class="btn primary" id="go-new">${icon("plus", 15)} New Analysis</button></div>
    </div>
    <div id="dash-body">${sk.page()}</div>`;
  $("#go-new").onclick = () => location.hash = "#/new";

  let s, tenders;
  try {
    [s, tenders] = await Promise.all([api("/api/stats"), api("/api/tenders")]);
  } catch (e) {
    $("#dash-body").innerHTML = renderError(e.message); return;
  }

  const distTotal = s.compliant + s.review + s.non_compliant;
  $("#dash-body").innerHTML = `
    <div class="grid kpi-5 mb">
      <div class="kpi"><div class="k-top"><span class="k-lbl">Active Tenders</span><span class="k-ico">${icon("tender", 16)}</span></div>
        <div class="k-num">${s.tenders}</div><div class="k-foot">${icon("layers", 12)} ${s.requirements} requirements extracted</div></div>
      <div class="kpi"><div class="k-top"><span class="k-lbl">Bids Analysed</span><span class="k-ico">${icon("bids", 16)}</span></div>
        <div class="k-num">${s.bids_analysed}</div><div class="k-foot">${icon("files", 12)} ${s.documents} documents processed</div></div>
      <div class="kpi"><div class="k-top"><span class="k-lbl">Compliant</span><span class="k-ico ok">${icon("check", 16)}</span></div>
        <div class="k-num" style="color:var(--ok)">${s.compliant}</div><div class="k-foot">${icon("eye", 12)} evidence found ${s.evidence_found}/${s.evidence_total}</div></div>
      <div class="kpi"><div class="k-top"><span class="k-lbl">Review Required</span><span class="k-ico warn">${icon("alert", 16)}</span></div>
        <div class="k-num" style="color:var(--warn)">${s.review}</div><div class="k-foot">${icon("user", 12)} human review queue</div></div>
      <div class="kpi"><div class="k-top"><span class="k-lbl">Non-Compliant</span><span class="k-ico bad">${icon("x", 16)}</span></div>
        <div class="k-num" style="color:var(--bad)">${s.non_compliant}</div><div class="k-foot">${icon("alert", 12)} needs attention</div></div>
    </div>

    <div class="grid main-split">
      <div class="card">
        <div class="card-head"><h3>Recent Tender Analysis</h3><a class="hint" href="#/tenders">View all →</a></div>
        ${tenders.length ? `<div class="table-wrap"><table class="table">
          <thead><tr><th>Tender ID</th><th>Tender Name</th><th>Bids</th><th>Best Compliance</th><th>Status</th><th>Last Analysed</th></tr></thead>
          <tbody>${tenders.map(t => `
            <tr class="rowlink" data-href="#/tender/${t.id}">
              <td class="mono">${esc(t.ref_no || "—")}</td>
              <td><span class="t-title">${esc(t.title)}</span><div class="t-sub">${t.n_requirements} requirements · ${t.n_documents} documents</div></td>
              <td class="num">${t.n_bidders}</td>
              <td>${t.latest_score != null ? `<span class="num">${t.latest_score}%</span>` : '<span class="muted">—</span>'}</td>
              <td>${t.latest_score == null ? '<span class="chip mut">Awaiting analysis</span>' :
                  t.latest_verdict === "GOOD" ? statusChip("COMPLIANT") :
                  t.latest_verdict === "REVIEW" ? statusChip("REVIEW_REQUIRED") : statusChip("NON_COMPLIANT")}</td>
              <td class="muted">${t.last_analysed ? timeAgo(t.last_analysed) : "—"}</td>
            </tr>`).join("")}</tbody></table></div>`
        : `<div class="empty"><div class="e-ico">${icon("tender", 20)}</div><b>No tenders yet</b><p>Create your first compliance analysis to get started.</p>
           <button class="btn primary mt" onclick="location.hash='#/new'">${icon("plus", 14)} New Analysis</button></div>`}
      </div>

      <div style="display:flex;flex-direction:column;gap:16px">
        <div class="card">
          <div class="card-head"><h3>Compliance Overview</h3><span class="hint">${distTotal} checks</span></div>
          <div class="card-body">
            <div style="display:flex;align-items:baseline;gap:8px">
              <span style="font-size:26px;font-weight:760;letter-spacing:-.02em;font-variant-numeric:tabular-nums">${distTotal ? Math.round(s.compliant / distTotal * 100) : 0}%</span>
              <span class="small muted" style="font-weight:550">of all checks compliant</span>
            </div>
            <div class="mt-s">${segbarHtml(s.compliant, s.review, s.non_compliant, "lg")}</div>
            <div class="sb-counts mt-s">
              <span><i class="dot ok"></i> ${s.compliant} Compliant</span>
              <span><i class="dot warn"></i> ${s.review} Review</span>
              <span><i class="dot bad"></i> ${s.non_compliant} Non-Compliant</span>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-head"><h3>Evidence Traceability</h3></div>
          <div class="card-body">
            <div class="trace">
              <div class="t-step done"><span class="t-dot">1</span><div class="t-body"><b>Requirement</b><span>Extracted from the tender with its source clause</span></div></div>
              <div class="t-step done"><span class="t-dot">2</span><div class="t-body"><b>Evidence</b><span>Retrieved from bidder documents with page citations</span></div></div>
              <div class="t-step done"><span class="t-dot">3</span><div class="t-body"><b>Rule</b><span>Deterministic comparison — never an LLM opinion</span></div></div>
              <div class="t-step done"><span class="t-dot">4</span><div class="t-body"><b>Result</b><span>Officer reviews every verdict with evidence in hand</span></div></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card mt">
      <div class="card-head"><h3>Analysis Pipeline</h3><span class="hint">how every bid is evaluated</span></div>
      <div class="card-body" style="padding:16px 12px">
        <div class="pipeline">
          ${PIPELINE_STEPS.map(([ic, t, d]) => `<div class="p-node"><span class="p-ico">${icon(ic, 16)}</span><b>${t}</b><span>${d}</span></div>`).join("")}
        </div>
      </div>
    </div>`;

  $$("#dash-body tr.rowlink").forEach(tr => tr.onclick = () => location.hash = tr.dataset.href);
}

/* ------------------------------------------------------------------ TENDERS */

async function tendersView() {
  view.innerHTML = `
    <div class="page-head">
      <div><h1>Tenders</h1><div class="sub">All tender documents and their extracted eligibility requirements.</div></div>
      <div class="actions"><button class="btn primary" onclick="location.hash='#/new'">${icon("plus", 15)} New Analysis</button></div>
    </div>
    <div class="card" id="t-table">${sk.table()}</div>`;
  const tenders = await api("/api/tenders");
  $("#t-table").innerHTML = tenders.length ? `<div class="table-wrap"><table class="table">
    <thead><tr><th>Tender ID</th><th>Tender Name</th><th>Reqs</th><th>Bidders</th><th>Docs</th><th>Best Compliance</th><th>Last Analysed</th><th></th></tr></thead>
    <tbody>${tenders.map(t => `
      <tr class="rowlink" data-href="#/tender/${t.id}">
        <td class="mono">${esc(t.ref_no || "—")}</td>
        <td><span class="t-title">${esc(t.title)}</span><div class="t-sub">${esc(t.department || "")}</div></td>
        <td class="num">${t.n_requirements}</td>
        <td class="num">${t.n_bidders}</td>
        <td class="num">${t.n_documents}</td>
        <td>${t.latest_score != null ? `<span class="num">${t.latest_score}%</span>` : '<span class="muted">—</span>'}</td>
        <td class="muted">${t.last_analysed ? timeAgo(t.last_analysed) : "—"}</td>
        <td class="t-actions"><button class="btn sm danger" data-del="${t.id}" title="Delete tender">${icon("trash", 13)}</button></td>
      </tr>`).join("")}</tbody></table></div>`
  : `<div class="empty"><div class="e-ico">${icon("tender", 20)}</div><b>No tenders yet</b><p>Upload a tender PDF to begin.</p></div>`;

  $$("#t-table tr.rowlink").forEach(tr => tr.onclick = e => {
    if (e.target.closest("[data-del]")) return;
    location.hash = tr.dataset.href;
  });
  $$("#t-table [data-del]").forEach(b => b.onclick = async e => {
    e.stopPropagation();
    if (!confirm("Delete this tender and all its documents and analyses?")) return;
    await api(`/api/tenders/${b.dataset.del}`, { method: "DELETE" });
    toast("Tender deleted", "", "info");
    searchCache.at = 0;
    route();
  });
}

/* ------------------------------------------------------------------ BIDS */

async function bidsView() {
  view.innerHTML = `
    <div class="page-head">
      <div><h1>Bids</h1><div class="sub">Every analysed bid across all tenders, with rule-engine verdicts.</div></div>
    </div>
    <div class="card" id="b-table">${sk.table()}</div>`;
  const bids = await api("/api/analyses");
  $("#b-table").innerHTML = bids.length ? `<div class="table-wrap"><table class="table">
    <thead><tr><th>Bidder</th><th>Tender</th><th>Score</th><th>Result</th><th>Breakdown</th><th>Analysed</th><th></th></tr></thead>
    <tbody>${bids.map(b => `
      <tr class="rowlink" data-href="#/analysis/${b.id}">
        <td><span class="t-title">${esc(b.bidder_name)}</span></td>
        <td><div>${esc(b.tender_title)}</div><div class="t-sub mono">${esc(b.tender_ref || "")}</div></td>
        <td><span class="num" style="font-size:14px">${b.score}%</span></td>
        <td>${verdictChip(b.verdict)}</td>
        <td><span class="chip mut">${b.n_compliant} ✓ · ${b.n_review} ⚠ · ${b.n_non_compliant} ✗</span></td>
        <td class="muted">${timeAgo(b.created_at)}</td>
        <td class="t-actions"><a class="btn sm" href="#/analysis/${b.id}">Open</a></td>
      </tr>`).join("")}</tbody></table></div>`
  : `<div class="empty"><div class="e-ico">${icon("bids", 20)}</div><b>No bids analysed yet</b><p>Upload bidder documents and run the compliance analysis.</p></div>`;
  $$("#b-table tr.rowlink").forEach(tr => tr.onclick = () => location.hash = tr.dataset.href);
}

/* ------------------------------------------------------------------ DOCUMENTS */

async function documentsView() {
  view.innerHTML = `
    <div class="page-head">
      <div><h1>Documents</h1><div class="sub">All tender and bid documents processed by the platform.</div></div>
    </div>
    <div class="card" id="d-table">${sk.table()}</div>`;
  const docs = await api("/api/documents");
  $("#d-table").innerHTML = docs.length ? `<div class="table-wrap"><table class="table">
    <thead><tr><th>Document</th><th>Type</th><th>Pages</th><th>Text</th><th>Tender</th><th>Source</th><th>Uploaded</th></tr></thead>
    <tbody>${docs.map(d => `
      <tr>
        <td><span class="t-title">${esc(d.filename)}</span>${d.ocr_needed ? ' <span class="chip warn">OCR recommended</span>' : ""}</td>
        <td><span class="chip ${d.role === "TENDER" ? "pri" : "mut"}">${esc(d.doc_type)}</span></td>
        <td class="num">${d.page_count}</td>
        <td class="muted mono">${(d.char_count / 1000).toFixed(1)}k chars</td>
        <td>${d.tender_title ? `<a href="#/tender/${d.tender_id}">${esc(d.tender_title)}</a>` : "—"}</td>
        <td class="muted">${esc(d.bidder_name || (d.role === "TENDER" ? "Issuing authority" : "—"))}</td>
        <td class="muted">${timeAgo(d.created_at)}</td>
      </tr>`).join("")}</tbody></table></div>`
  : `<div class="empty"><div class="e-ico">${icon("files", 20)}</div><b>No documents yet</b><p>Uploaded PDFs will appear here.</p></div>`;
}

/* ------------------------------------------------------------------ VERIFICATION */

async function verificationView() {
  view.innerHTML = `
    <div class="page-head">
      <div><h1>Verification Services</h1><div class="sub">External identifier verification abstraction. Prototype uses a deterministic mock service behind a live-API contract.</div></div>
    </div>
    <div class="grid cols-2">
      <div class="card">
        <div class="card-head"><h3>${icon("shield", 15)} GST Verification</h3><span class="chip mut">Service</span></div>
        <div class="card-body">
          <label class="f">GSTIN</label>
          <input type="text" id="gstin" placeholder="36ABCDE1234F1Z5" style="text-transform:uppercase" />
          <label class="f">Registered name <span class="opt">(optional)</span></label>
          <input type="text" id="gname" placeholder="ABC Technologies Pvt Ltd" />
          <div class="row-actions mt"><button class="btn primary" id="v-gst">${icon("shield", 14)} Verify GSTIN</button></div>
          <div id="gst-out"></div>
        </div>
      </div>
      <div class="card">
        <div class="card-head"><h3>${icon("shield", 15)} PAN Verification</h3><span class="chip mut">Service</span></div>
        <div class="card-body">
          <label class="f">PAN</label>
          <input type="text" id="pan" placeholder="ABCDE1234F" style="text-transform:uppercase" />
          <div class="row-actions mt"><button class="btn primary" id="v-pan">${icon("shield", 14)} Verify PAN</button></div>
          <div id="pan-out"></div>
        </div>
      </div>
    </div>
    <div class="note mt">${icon("info", 14)} <span><b>Prototype notice:</b> responses come from a deterministic mock — the request/response contract matches a live government API integration, so credentials can be swapped in without changes upstream. Format validation is real.</span></div>`;

  const runVerify = async (btn, outSel, path, fields, kind) => {
    const out = $(outSel);
    btn.classList.add("loading");
    btn.innerHTML = `<span class="spin"></span> Verifying…`;
    try {
      const fd = new FormData();
      fields.forEach(([k, sel]) => fd.append(k, $(sel).value.trim()));
      const r = await api(path, { method: "POST", body: fd });
      const ok = r.status === "VERIFIED";
      out.innerHTML = `
        <div class="verif-result">
          <div class="v-head ${ok ? "" : "bad"}">
            <span class="v-ico">${icon(ok ? "shield" : "shieldOff", 17)}</span>
            <div><b>${esc(r.reference)}</b><span>${ok ? "VERIFIED — ACTIVE" : esc(r.status)}</span></div>
            <span style="margin-left:auto">${ok ? '<span class="chip solid-ok">' + icon("check", 11) + " VERIFIED</span>" : '<span class="chip bad">NOT VERIFIED</span>'}</span>
          </div>
          <div class="v-rows">
            ${r.legal_name ? `<div class="v-row"><span class="k">Legal Name</span><span class="v">${esc(r.legal_name)}</span></div>` : ""}
            ${Object.entries(r.detail || {}).filter(([k]) => k !== "service").map(([k, v]) =>
              `<div class="v-row"><span class="k">${esc(k.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()))}</span><span class="v">${esc(String(v))}</span></div>`).join("")}
          </div>
          <div class="v-foot">${kind} check · ${new Date().toLocaleTimeString("en-IN", { hour12: false })} · ${esc(r.detail?.service || "verification abstraction")}</div>
        </div>`;
      toast(ok ? `${kind} verified` : `${kind} could not be verified`, r.reference, ok ? "ok" : "err");
    } catch (e) {
      toast("Verification failed", e.message, "err");
    }
    btn.classList.remove("loading");
    btn.innerHTML = `${icon("shield", 14)} Verify ${kind}`;
  };

  $("#v-gst").onclick = e => runVerify(e.currentTarget, "#gst-out", "/api/verify/gst", [["gstin", "#gstin"], ["bidder_name", "#gname"]], "GSTIN");
  $("#v-pan").onclick = e => runVerify(e.currentTarget, "#pan-out", "/api/verify/pan", [["pan", "#pan"]], "PAN");
}

/* ------------------------------------------------------------------ REPORTS */

async function reportsView() {
  view.innerHTML = `
    <div class="page-head">
      <div><h1>Reports</h1><div class="sub">Official bid compliance assessments, generated from rule-engine results.</div></div>
    </div>
    <div class="grid cols-2" id="r-list">${sk.table()}</div>`;
  const bids = await api("/api/analyses");
  $("#r-list").innerHTML = bids.length ? bids.map(b => `
    <div class="card card-body" style="display:flex;align-items:center;gap:16px">
      <div style="flex:1;min-width:0">
        <b style="font-size:14px">${esc(b.bidder_name)}</b>
        <div class="small muted">${esc(b.tender_title)}</div>
        <div class="small mono muted">${esc(b.tender_ref || "")} · ${fmtDate(b.created_at)}</div>
      </div>
      <div style="width:150px;flex:none;display:flex;flex-direction:column;gap:6px">
        <span style="font-size:20px;font-weight:740;letter-spacing:-.02em;font-variant-numeric:tabular-nums;color:${scoreColor(b.verdict)}">${b.score}%</span>
        ${segbarHtml(b.n_compliant, b.n_review, b.n_non_compliant)}
        <span class="small muted">${b.n_compliant + b.n_review + b.n_non_compliant} checks evaluated</span>
      </div>
      <div style="text-align:right;display:flex;flex-direction:column;gap:7px;align-items:flex-end">
        ${verdictChip(b.verdict)}
        <a class="btn sm primary" href="#/report/${b.id}">${icon("report", 13)} Open Report</a>
      </div>
    </div>`).join("")
  : `<div class="empty" style="grid-column:1/-1"><div class="e-ico">${icon("report", 20)}</div><b>No reports yet</b><p>Reports are generated after a bid analysis completes.</p></div>`;
}

/* ------------------------------------------------------------------ AUDIT */

const EVENT_META = {
  TENDER_UPLOADED: ["tender", "Tender uploaded"],
  REQUIREMENTS_EXTRACTED: ["layers", "Requirements extracted"],
  BID_UPLOAD: ["upload", "Bid documents received"],
  EVIDENCE_INDEXED: ["eye", "Evidence indexed"],
  VERIFICATION_COMPLETED: ["shield", "Verification completed"],
  COMPLIANCE_RULES_EXECUTED: ["zap", "Compliance rules executed"],
  ANALYSIS_STARTED: ["activity", "Analysis started"],
  ANALYSIS_COMPLETED: ["check", "Analysis completed"],
};

async function auditView() {
  view.innerHTML = `
    <div class="page-head">
      <div><h1>Audit Trail</h1><div class="sub">Chronological record of every platform event — upload, extraction, verification and rule execution.</div></div>
    </div>
    <div class="card"><div class="card-body" id="audit-body">${sk.table()}</div></div>`;
  const [events, tenders] = await Promise.all([api("/api/audit?limit=200"), api("/api/tenders")]);
  $("#audit-body").innerHTML = `
    <div style="display:flex;justify-content:flex-end;margin-bottom:14px">
      <select id="audit-filter" style="width:280px">
        <option value="">All tenders</option>
        ${tenders.map(t => `<option value="${t.id}">${esc(t.title)}</option>`).join("")}
      </select>
    </div>
    <div class="timeline">${events.map(e => {
      const [ic, label] = EVENT_META[e.event] || ["clock", e.event.replaceAll("_", " ").toLowerCase()];
      return `<div class="tl-item ${/completed|extracted|executed/.test(e.event) ? "ok" : ""}" data-tender="${e.tender_id || ""}">
        <span class="tl-dot">${icon(ic, 11)}</span>
        <div class="tl-head"><b>${esc(label)}</b><span class="when">${fmtTime(e.ts)}</span>${e.tender_title ? `<span class="chip mut">${esc(e.tender_title)}</span>` : ""}</div>
        <p>${esc(e.detail)}</p>
      </div>`;
    }).join("") || '<div class="empty">No events recorded yet.</div>'}</div>`;
  $("#audit-filter").onchange = e => {
    const v = e.target.value;
    $$("#audit-body .tl-item").forEach(el => el.style.display = (!v || el.dataset.tender === v) ? "" : "none");
  };
}

/* ------------------------------------------------------------------ NEW ANALYSIS WIZARD */

const wiz = { step: 1, tender: null, bidder: null, analysis: null };
const WIZ_STEPS = ["Tender", "Requirements", "Bid Documents", "Analysis", "Results"];

async function newAnalysisView() {
  view.innerHTML = `
    <div class="page-head">
      <div><h1>New Compliance Analysis</h1><div class="sub">Upload a tender and bidder documents to begin automated compliance verification.</div></div>
    </div>
    <div id="wiz"></div>`;
  renderWizard();
}

function stepperHtml(current) {
  return `<div class="stepper">${WIZ_STEPS.map((label, i) => {
    const n = i + 1;
    const cls = n < current ? "done" : n === current ? "active" : "";
    return `<div class="step ${cls}"><span class="s-num">${n < current ? icon("check", 13) : n}</span><b>${label}</b></div>`;
  }).join("")}</div>`;
}

function renderWizard() {
  const el = $("#wiz");
  el.innerHTML = stepperHtml(wiz.step) + `<div id="wiz-body" class="tabpane"></div>`;
  $$(".step", el).forEach((s, i) => {
    if (i + 1 < wiz.step) s.style.cursor = "pointer", s.onclick = () => { wiz.step = i + 1; renderWizard(); };
  });
  const body = $("#wiz-body");
  if (wiz.step === 1) wizStep1(body);
  else if (wiz.step === 2) wizStep2(body);
  else if (wiz.step === 3) wizStep3(body);
  else if (wiz.step === 4) { wiz.step = 5; renderWizard(); }
  else wizStep5(body);
}

function wizStep1(body) {
  body.innerHTML = `
    <div class="grid main-split">
      <div class="card">
        <div class="card-head"><h3>Upload Tender Document</h3><span class="chip mut">Step 1</span></div>
        <div class="card-body">
          <div class="dropzone" id="w-dz">
            <div class="dz-ico">${icon("upload", 20)}</div>
            <div class="dz-main">Drag & drop the tender PDF, or <u>browse files</u></div>
            <div class="dz-sub">PDF only · text-based documents extract best</div>
          </div>
          <input type="file" id="w-file" accept="application/pdf" class="hidden" />
          <div class="filelist" id="w-flist"></div>
          <label class="f">Tender title</label>
          <input type="text" id="w-title" placeholder="e.g. IT Infrastructure Procurement 2026" />
          <label class="f">Issuing department <span class="opt">(optional)</span></label>
          <input type="text" id="w-dept" placeholder="e.g. Department of Information Technology" />
          <label class="f">Reference number <span class="opt">(optional — auto-detected from the PDF)</span></label>
          <input type="text" id="w-ref" placeholder="e.g. GeM/2026/B/…" />
          <div class="row-actions mt"><button class="btn primary" id="w-go" disabled>${icon("upload", 14)} Upload & Extract Requirements</button></div>
          <div id="w-err"></div>
        </div>
      </div>
      <div class="card">
        <div class="card-head"><h3>What the engine extracts</h3></div>
        <div class="card-body">
          <div class="trace">
            ${[["Numeric thresholds", "Minimum annual turnover in ₹ crore / lakh"],
               ["Experience counts", "Years of experience, similar projects completed"],
               ["Certifications", "ISO, GST, MSME/Udyam, OEM, GeM, DPIIT and more"],
               ["Validity dates", "Certificates valid through the bid period"]].map(([t, d], i) => `
              <div class="t-step done"><span class="t-dot">${i + 1}</span><div class="t-body"><b>${t}</b><span>${d}</span></div></div>`).join("")}
          </div>
          <div class="note mt">${icon("info", 14)} <span>Each requirement keeps its <b>source clause</b>, so officers can audit every decision back to the tender text.</span></div>
        </div>
      </div>
    </div>`;
  let file = null;
  const dz = $("#w-dz"), fi = $("#w-file");
  const setFile = f => {
    file = f;
    $("#w-flist").innerHTML = `<div class="fileitem"><span class="f-ico">${icon("file", 15)}</span>
      <div class="f-name"><b>${esc(f.name)}</b><span>${(f.size / 1024).toFixed(0)} KB · PDF</span></div></div>`;
    $("#w-go").disabled = !$("#w-title").value.trim();
  };
  $("#w-title").oninput = e => $("#w-go").disabled = !e.target.value.trim() || !file;
  dz.onclick = () => fi.click();
  dz.ondragover = e => { e.preventDefault(); dz.classList.add("drag"); };
  dz.ondragleave = () => dz.classList.remove("drag");
  dz.ondrop = e => { e.preventDefault(); dz.classList.remove("drag"); if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]); };
  fi.onchange = () => fi.files[0] && setFile(fi.files[0]);

  $("#w-go").onclick = async () => {
    const btn = $("#w-go");
    btn.classList.add("loading"); btn.innerHTML = `<span class="spin"></span> Extracting…`;
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("title", $("#w-title").value.trim());
      fd.append("department", $("#w-dept").value.trim());
      fd.append("ref_no", $("#w-ref").value.trim());
      wiz.tender = await api("/api/tenders", { method: "POST", body: fd });
      searchCache.at = 0;
      toast("Tender uploaded", `${wiz.tender.requirements.length} requirements detected`);
      wiz.step = 2;
      renderWizard();
    } catch (e) {
      $("#w-err").innerHTML = `<div class="review-note" style="background:var(--bad-soft);border-color:var(--bad-line);color:var(--bad-text)">${icon("alert", 15)} <span>${esc(e.message)}</span></div>`;
      btn.classList.remove("loading"); btn.innerHTML = `${icon("upload", 14)} Upload & Extract Requirements`;
    }
  };
}

function wizStep2(body) {
  const t = wiz.tender;
  body.innerHTML = `
    <div class="card">
      <div class="card-head"><h3>Requirements Detected</h3>
        <span class="chip pri">${t.requirements.length} requirements · ${esc(t.ref_no || t.title)}</span></div>
      <div class="card-body">
        <div class="req-list">
          ${t.requirements.map(r => reqCard(r)).join("")}
        </div>
        <div class="row-actions mt">
          <button class="btn ghost" onclick="wiz.step=1;renderWizard()">${icon("arrow", 14)} Back</button>
          <button class="btn primary" onclick="wiz.step=3;renderWizard()">Continue to Bid Documents ${icon("arrow", 14)}</button>
        </div>
      </div>
    </div>`;
}

function wizStep3(body) {
  body.innerHTML = `
    <div class="card">
      <div class="card-head"><h3>Upload Bid Documents</h3><span class="chip mut">Step 3</span></div>
      <div class="card-body">
        <label class="f">Bidder / firm name</label>
        <input type="text" id="wb-name" placeholder="e.g. ABC Technologies Pvt Ltd" />
        <label class="f">Supporting documents <span class="opt">(financial statements, certificates, work orders — PDF)</span></label>
        <div class="dropzone" id="wb-dz">
          <div class="dz-ico">${icon("upload", 20)}</div>
          <div class="dz-main">Drag & drop bid documents, or <u>browse files</u></div>
          <div class="dz-sub">Multiple PDFs supported · document types are detected automatically</div>
        </div>
        <input type="file" id="wb-files" accept="application/pdf" multiple class="hidden" />
        <div class="filelist" id="wb-flist"></div>
        <div id="wb-done"></div>
        <div class="row-actions mt">
          <button class="btn ghost" onclick="wiz.step=2;renderWizard()">${icon("arrow", 14)} Back</button>
          <button class="btn" id="wb-upload" disabled>${icon("upload", 14)} Upload Documents</button>
          <button class="btn primary" id="wb-run" disabled>${icon("zap", 14)} Run Compliance Analysis</button>
        </div>
        <div id="wb-err"></div>
      </div>
    </div>`;

  let files = [];
  const dz = $("#wb-dz"), fi = $("#wb-files");
  const refresh = () => {
    $("#wb-flist").innerHTML = files.map(f => `<div class="fileitem"><span class="f-ico">${icon("file", 15)}</span>
      <div class="f-name"><b>${esc(f.name)}</b><span>${(f.size / 1024).toFixed(0)} KB</span></div></div>`).join("");
    $("#wb-upload").disabled = !files.length || !$("#wb-name").value.trim();
  };
  $("#wb-name").oninput = refresh;
  dz.onclick = () => fi.click();
  dz.ondragover = e => { e.preventDefault(); dz.classList.add("drag"); };
  dz.ondragleave = () => dz.classList.remove("drag");
  dz.ondrop = e => { e.preventDefault(); dz.classList.remove("drag"); files = [...files, ...e.dataTransfer.files]; refresh(); };
  fi.onchange = () => { files = [...files, ...fi.files]; refresh(); };

  $("#wb-upload").onclick = async () => {
    const btn = $("#wb-upload");
    btn.classList.add("loading"); btn.innerHTML = `<span class="spin"></span> Processing…`;
    try {
      const fd = new FormData();
      fd.append("bidder_name", $("#wb-name").value.trim());
      files.forEach(f => fd.append("files", f));
      wiz.upload = await api(`/api/tenders/${wiz.tender.id}/documents`, { method: "POST", body: fd });
      searchCache.at = 0;
      $("#wb-done").innerHTML = `<div class="filelist">${wiz.upload.documents.map(d => `
        <div class="fileitem"><span class="f-ico" style="background:var(--ok-soft);color:var(--ok)">${icon("check", 14)}</span>
          <div class="f-name"><b>${esc(d.filename)}</b><span>${d.page_count} pages · ${(d.char_count / 1000).toFixed(1)}k chars extracted</span></div>
          <span class="f-badge"><span class="chip pri">${esc(d.doc_type)}</span></span></div>`).join("")}</div>`;
      toast("Documents processed", `${wiz.upload.documents.length} documents indexed for evidence retrieval`);
      $("#wb-run").disabled = false;
      btn.classList.remove("loading"); btn.innerHTML = `${icon("check", 14)} Uploaded`;
      btn.disabled = true;
    } catch (e) {
      $("#wb-err").innerHTML = `<div class="review-note" style="background:var(--bad-soft);border-color:var(--bad-line);color:var(--bad-text)">${icon("alert", 15)} <span>${esc(e.message)}</span></div>`;
      btn.classList.remove("loading"); btn.innerHTML = `${icon("upload", 14)} Upload Documents`;
    }
  };

  $("#wb-run").onclick = () => runAnalysisFlow(wiz.tender.id, wiz.upload.bidder_id, $("#wb-name").value.trim(), () => { wiz.step = 5; renderWizard(); });
}

function wizStep5(body) {
  const a = wiz.analysis;
  body.innerHTML = `
    <div class="card">
      <div class="card-head"><h3>Analysis Complete</h3><span class="chip mut">Step 5 · Results</span></div>
      <div class="card-body">
        <div class="score-card" style="border:1px solid var(--line);border-radius:10px;background:var(--surface-2)">
          ${a ? `
          <div class="score-block">
            <div class="sb-top"><b style="font-size:16px">${esc(a.bidder_name)}</b> ${verdictChip(a.verdict)}</div>
            <div class="small muted">${esc(a.tender_title || "")}</div>
            <div class="sb-num" style="font-size:38px;color:${scoreColor(a.verdict)}">${a.score}<span>%</span></div>
            ${segbarHtml(a.n_compliant, a.n_review, a.n_non_compliant, "lg")}
            <div class="sb-counts">
              <span><i class="dot ok"></i> ${a.n_compliant} Compliant</span>
              <span><i class="dot warn"></i> ${a.n_review} Review</span>
              <span><i class="dot bad"></i> ${a.n_non_compliant} Non-Compliant</span>
            </div>
          </div>` : ""}</div>
        <div class="row-actions mt">
          ${a ? `<a class="btn primary" href="#/analysis/${a.id}">${icon("eye", 14)} View Full Analysis</a>` : ""}
          ${a ? `<a class="btn" href="#/report/${a.id}">${icon("report", 14)} Generate Report</a>` : ""}
          <button class="btn ghost" onclick="location.hash='#/'">Back to Overview</button>
          <button class="btn ghost" onclick="wiz.step=3;renderWizard()">Upload Another Bidder</button>
        </div>
      </div>
    </div>`;
}

/* ------------------------------------------------------------------ processing overlay */

const ANALYSIS_STEPS = [
  "Reading submitted documents",
  "Matching requirements",
  "Retrieving evidence",
  "Verifying information",
  "Applying compliance rules",
  "Generating assessment",
];

async function runProcessing({ title, sub, steps, work, minMs = 3400 }) {
  const ov = $("#process-overlay"), card = $("#process-card");
  card.innerHTML = `
    <h3>${esc(title)}</h3>
    <div class="p-sub">${esc(sub)}</div>
    <div class="psteps">${steps.map((s, i) => `
      <div class="pstep" data-i="${i}"><span class="ps-ico">${icon("check", 12)}</span><span>${esc(s)}</span><span class="p-num">${String(i + 1).padStart(2, "0")}</span></div>`).join("")}</div>`;
  ov.classList.add("open");
  const els = $$(".pstep", card);
  els[0].classList.add("active");
  let i = 0;
  const timer = setInterval(() => {
    if (i < els.length - 1) { els[i].className = "pstep done"; i++; els[i].classList.add("active"); }
  }, minMs / steps.length);
  try {
    const [result] = await Promise.all([work, new Promise(r => setTimeout(r, minMs))]);
    clearInterval(timer);
    els.forEach(e => e.className = "pstep done");
    await new Promise(r => setTimeout(r, 450));
    ov.classList.remove("open");
    return result;
  } catch (e) {
    clearInterval(timer);
    ov.classList.remove("open");
    throw e;
  }
}

async function runAnalysisFlow(tenderId, bidderId, bidderName, onDone) {
  try {
    const a = await runProcessing({
      title: "Analysing Bid",
      sub: `${bidderName} · compliance pipeline in progress`,
      steps: ANALYSIS_STEPS,
      work: api(`/api/tenders/${tenderId}/analyze`, {
        method: "POST",
        body: new URLSearchParams({ bidder_id: bidderId }),
      }),
    });
    wiz.analysis = a;
    searchCache.at = 0;
    toast("Analysis complete", `Score ${a.score}% · ${a.verdict === "GOOD" ? "Good standing" : a.verdict === "REVIEW" ? "Officer review" : "Compliance risk"}`);
    onDone(a);
  } catch (e) {
    toast("Analysis failed", e.message, "err");
  }
}

/* ------------------------------------------------------------------ requirement cards */

function reqCard(r, result = null, opts = {}) {
  const status = result ? result.status : null;
  const cls = status ? " " + status.toLowerCase() : "";
  const reqShort = r.req_type === "document"
    ? (r.evidence_required && r.evidence_required[0] ? r.evidence_required[0] : "Document")
    : requiredText(r);
  const head = `
    <div class="req-row" data-toggle>
      <span class="mark">${status ? icon(STATUS[status].ic, 14) : icon("file", 14)}</span>
      <div class="r-name"><b>${esc(r.title)}</b><span>${esc(r.code)} · ${esc(requiredText(r))}</span></div>
      ${result ? `
        <div class="r-cell opt"><div class="lbl">Required</div><div class="val">${esc(reqShort)}</div></div>
        <div class="r-cell"><div class="lbl">Found</div><div class="val ${result.extracted_value || result.evidence_doc_name ? "" : "miss"}">${esc(result.extracted_value || (result.evidence_doc_name ? "Located" : result.status === "NON_COMPLIANT" ? "Not found" : "—"))}</div></div>
        <div>${statusChip(status)}</div>`
      : opts.compact ? `
        <div class="r-cell" style="grid-column:span 3"><div class="val miss" style="font-weight:500">${r.evidence_required.length ? esc(r.evidence_required.join(" · ")) : "—"}</div></div>` : `
        <div class="r-cell opt"><div class="lbl">Evidence expected</div><div class="val miss">${r.evidence_required.length ? esc(r.evidence_required.join(", ")) : "—"}</div></div>
        <div class="r-cell"><div class="lbl">Type</div><div class="val miss" style="text-transform:capitalize">${esc(r.req_type)}</div></div>`}
      <span class="chev">${icon("chev", 15)}</span>
    </div>`;
  const body = `
    <div class="req-detail"><div class="d-grid">
      <div class="d-main">
        <dl class="kv">
          <dt>Requirement</dt><dd>${esc(r.description || r.title)}</dd>
          <dt>Source clause</dt><dd class="small muted">“${esc(r.source_clause)}”</dd>
          <dt>Evidence expected</dt><dd>${r.evidence_required.length ? r.evidence_required.map(e => `<span class="chip mut">${esc(e)}</span>`).join(" ") : "—"}</dd>
          ${result ? `
            <dt>Extracted value</dt><dd><b>${esc(result.extracted_value || "—")}</b></dd>
            <dt>Rule applied</dt><dd class="mono small">${esc(result.rule_text || "—")}</dd>
            <dt>AI explanation</dt><dd>${esc(result.explanation)}</dd>` : ""}
        </dl>
        ${result && result.evidence_snippet ? `
          <div class="evidence-meta">
            <span class="file">${icon("file", 14)} ${esc(result.evidence_doc_name || "—")}</span>
            ${result.evidence_page ? `<span class="page">Page ${result.evidence_page}</span>` : ""}
          </div>
          <div class="snippet">${highlightSnippet(result.evidence_snippet, result.extracted_value)}</div>` : ""}
        ${result && result.status === "REVIEW_REQUIRED" ? `
          <div class="review-note">${icon("alert", 15)} <span><b>Human Review Required.</b> The system does not make a blind decision on this requirement — an officer must confirm before it counts toward the verdict. AI assists, the officer decides.</span></div>` : ""}
        ${result && result.recommendation ? `
          <div class="review-note" style="background:var(--accent-soft);border-color:var(--accent-line);color:var(--accent-strong)">${icon("info", 15)} <span><b>Recommended action:</b> ${esc(result.recommendation)}</span></div>` : ""}
        ${result ? `<div class="row-actions mt"><button class="btn sm" data-evidence="${result.id}">${icon("eye", 13)} Inspect Evidence</button></div>` : ""}
      </div>
      <div class="d-side">
        <h5 class="eyebrow" style="display:flex;gap:6px;align-items:center">${icon("target", 12)} Traceability</h5>
        <div class="trace">
          <div class="t-step done"><span class="t-dot">1</span><div class="t-body"><b>Requirement</b><span>${esc(r.code)} — ${esc(r.title)}</span></div></div>
          <div class="t-step ${result && result.evidence_doc_name ? "done" : result ? "bad" : ""}"><span class="t-dot">2</span><div class="t-body"><b>Evidence</b><span>${result ? (result.evidence_doc_name ? `${esc(result.evidence_doc_name)}${result.evidence_page ? " · page " + result.evidence_page : ""}` : "Not found in submission") : esc(requiredText(r))}</span></div></div>
          <div class="t-step done"><span class="t-dot">3</span><div class="t-body"><b>Rule</b><span>${esc(result ? result.rule_text || "Document presence check" : "Engine extracts and compares")}</span></div></div>
          <div class="t-step ${status ? status === "COMPLIANT" ? "done" : status === "REVIEW_REQUIRED" ? "warn" : "bad" : ""}"><span class="t-dot">4</span><div class="t-body"><b>Result</b><span>${status ? STATUS[status].label : "Pending analysis"}</span></div></div>
        </div>
        ${result ? `<div class="mt-s small muted">${esc(REASON_TEXT[result.reason] || result.reason || "")}</div>` : ""}
      </div>
    </div></div>`;
  return `<div class="req${cls}" id="${opts.id || ""}">${head}${body}</div>`;
}

function bindReqToggles(container) {
  $$("[data-toggle]", container).forEach(row => row.onclick = () => row.parentElement.classList.toggle("open"));
}

/* ------------------------------------------------------------------ TENDER DETAIL */

async function tenderView(id) {
  const t = await api(`/api/tenders/${id}`);
  view.innerHTML = `
    <div class="card tender-hero">
      <div style="min-width:0">
        <div class="eyebrow">Tender</div>
        <h1>${esc(t.title)}</h1>
        <div class="ref">${esc(t.ref_no || "no reference number")}</div>
        <div class="meta-row">
          <div class="meta"><div class="m-k">Published</div><div class="m-v">${fmtDate(t.created_at)}</div></div>
          <div class="meta"><div class="m-k">Department</div><div class="m-v">${esc(t.department || "—")}</div></div>
          <div class="meta"><div class="m-k">Requirements</div><div class="m-v">${t.requirements.length}</div></div>
          <div class="meta"><div class="m-k">Bidders</div><div class="m-v">${t.bidders.filter(b => t.documents.some(d => d.bidder_id === b.id)).length}</div></div>
          <div class="meta"><div class="m-k">Documents</div><div class="m-v">${t.documents.length}</div></div>
          <div class="meta"><div class="m-k">Status</div><div class="m-v">${t.analyses.length ? '<span class="chip ok">' + icon("check", 11) + " Analysed</span>" : '<span class="chip pri">Analysis Ready</span>'}</div></div>
        </div>
      </div>
      <div class="row-actions" style="align-items:flex-start">
        <button class="btn primary" id="th-new">${icon("plus", 14)} Add Bid</button>
        <button class="btn" id="th-run">${icon("zap", 14)} Run Analysis</button>
      </div>
    </div>

    <div class="tabs mt" id="t-tabs">
      <button class="tab active" data-tab="overview">Overview</button>
      <button class="tab" data-tab="reqs">Requirements <span class="t-count">${t.requirements.length}</span></button>
      <button class="tab" data-tab="bidders">Bidders <span class="t-count">${t.bidders.filter(b => t.documents.some(d => d.bidder_id === b.id)).length}</span></button>
      <button class="tab" data-tab="docs">Documents <span class="t-count">${t.documents.length}</span></button>
      <button class="tab" data-tab="audit">Audit</button>
    </div>
    <div id="t-pane" class="tabpane"></div>
    <div id="t-upload" class="mt"></div>`;

  const done = t.analyses.filter(a => a.status === "DONE");
  const latestBidder = [...t.documents].reverse().find(d => d.role === "BID")?.bidder_id;

  const panes = {
    overview: () => `
      <div class="grid main-split">
        <div class="card">
          <div class="card-head"><h3>Bid Analyses</h3><span class="hint">${done.length} completed</span></div>
          ${t.analyses.length ? `<div class="table-wrap"><table class="table">
            <thead><tr><th>Bidder</th><th>Score</th><th>Result</th><th>Breakdown</th><th>Analysed</th><th></th></tr></thead>
            <tbody>${t.analyses.map(a => `
              <tr class="rowlink" data-href="#/analysis/${a.id}">
                <td><span class="t-title">${esc(a.bidder_name)}</span></td>
                <td><span class="num">${a.score}%</span></td>
                <td>${a.status === "DONE" ? verdictChip(a.verdict) : '<span class="chip mut">Running…</span>'}</td>
                <td><span class="chip mut">${a.n_compliant} ✓ · ${a.n_review} ⚠ · ${a.n_non_compliant} ✗</span></td>
                <td class="muted">${timeAgo(a.created_at)}</td>
                <td class="t-actions">${a.status === "DONE" ? `<a class="btn sm primary" href="#/report/${a.id}">${icon("report", 13)} Report</a>` : ""}</td>
              </tr>`).join("")}</tbody></table></div>`
          : `<div class="empty"><div class="e-ico">${icon("bids", 20)}</div><b>No bids analysed yet</b><p>Add a bidder's documents, then run the compliance analysis.</p></div>`}
        </div>
        <div class="card">
          <div class="card-head"><h3>Key Requirements</h3><span class="hint">${t.requirements.length} total</span></div>
          <div class="card-body" style="padding-top:8px">
            <div class="req-list">
              ${t.requirements.slice(0, 4).map(r => reqCard(r, null, { compact: true })).join("") || '<div class="empty">No requirements.</div>'}
            </div>
            ${t.requirements.length > 4 ? `<div class="mt-s"><a class="btn sm" data-goto="reqs">View all ${t.requirements.length} requirements ${icon("arrow", 12)}</a></div>` : ""}
          </div>
        </div>
      </div>`,
    reqs: () => `
      <div class="req-list">
        ${t.requirements.map(r => reqCard(r)).join("") || '<div class="empty">No requirements extracted.</div>'}
      </div>`,
    bidders: () => `
      <div class="card">
        <div class="card-head"><h3>Bidders</h3><span class="hint">run the analysis per bidder</span></div>
        ${(() => {
          const withDocs = t.bidders.filter(b => t.documents.some(d => d.bidder_id === b.id));
          return withDocs.length ? `<div class="table-wrap"><table class="table">
            <thead><tr><th>Bidder</th><th>GSTIN</th><th>Documents</th><th>Latest Result</th><th></th></tr></thead>
            <tbody>${withDocs.map(b => {
              const a = t.analyses.filter(x => x.bidder_id === b.id && x.status === "DONE").pop();
              return `<tr>
                <td><span class="t-title">${esc(b.name)}</span></td>
                <td class="mono">${esc(b.gstin || "—")}</td>
                <td class="num">${t.documents.filter(d => d.bidder_id === b.id).length}</td>
                <td>${a ? `${a.score}% ${verdictChip(a.verdict)}` : '<span class="chip mut">Not analysed</span>'}</td>
                <td class="t-actions">
                  ${a ? `<a class="btn sm" href="#/analysis/${a.id}">View</a>` : ""}
                  <button class="btn sm primary" data-run="${b.id}" data-name="${esc(b.name)}">${icon("zap", 13)} Analyse</button>
                </td></tr>`;
            }).join("")}</tbody></table></div>`
          : `<div class="empty"><div class="e-ico">${icon("user", 20)}</div><b>No bidders yet</b><p>Upload bid documents to create a bidder.</p></div>`;
        })()}
      </div>`,
    docs: () => `
      <div class="card">
        <div class="card-head"><h3>Documents on Record</h3><span class="hint">${t.documents.length} files</span></div>
        <div class="table-wrap"><table class="table">
          <thead><tr><th>Document</th><th>Type</th><th>Pages</th><th>Text</th><th>Source</th></tr></thead>
          <tbody>${t.documents.map(d => `
            <tr>
              <td><span class="t-title">${esc(d.filename)}</span>${d.ocr_needed ? ' <span class="chip warn">OCR recommended</span>' : ""}</td>
              <td><span class="chip ${d.role === "TENDER" ? "pri" : "mut"}">${esc(d.doc_type)}</span></td>
              <td class="num">${d.page_count}</td>
              <td class="muted mono">${(d.char_count / 1000).toFixed(1)}k chars</td>
              <td class="muted">${esc(d.bidder ? t.bidders.find(b => b.id === d.bidder_id)?.name || "Bidder" : "Issuing authority")}</td>
            </tr>`).join("")}</tbody></table></div>
      </div>`,
    audit: () => `<div class="card"><div class="card-body" id="t-audit">${sk.table()}</div></div>`,
  };

  const showPane = key => {
    $("#t-pane").innerHTML = panes[key]();
    bindReqToggles($("#t-pane"));
    $$("#t-pane tr.rowlink").forEach(tr => tr.onclick = () => location.hash = tr.dataset.href);
    $$("#t-pane [data-goto]").forEach(b => b.onclick = () => activateTab(b.dataset.goto));
    $$("#t-pane [data-run]").forEach(b => b.onclick = () =>
      runAnalysisFlow(t.id, Number(b.dataset.run), b.dataset.name, a => location.hash = `#/analysis/${a.id}`));
    if (key === "audit") loadTenderAudit(t.id);
  };
  const activateTab = key => {
    $$("#t-tabs .tab").forEach(b => b.classList.toggle("active", b.dataset.tab === key));
    showPane(key);
  };
  $$("#t-tabs .tab").forEach(b => b.onclick = () => activateTab(b.dataset.tab));
  showPane("overview");

  $("#th-new").onclick = () => renderUploadCard();
  $("#th-run").onclick = () => {
    if (!latestBidder) { toast("No bid documents", "Upload a bidder's documents first.", "err"); renderUploadCard(); return; }
    const name = t.bidders.find(b => b.id === latestBidder)?.name || "Bidder";
    runAnalysisFlow(t.id, latestBidder, name, a => location.hash = `#/analysis/${a.id}`);
  };

  function renderUploadCard() {
    $("#t-upload").innerHTML = `
      <div class="card" id="up-card">
        <div class="card-head"><h3>Add Bidder Documents</h3><button class="btn sm ghost" id="up-close">${icon("x", 13)}</button></div>
        <div class="card-body">
          <label class="f">Bidder / firm name</label>
          <input type="text" id="up-name" placeholder="e.g. ABC Technologies Pvt Ltd" />
          <label class="f">Documents <span class="opt">(PDF, multiple allowed)</span></label>
          <div class="dropzone" id="up-dz"><div class="dz-ico">${icon("upload", 20)}</div>
            <div class="dz-main">Drag & drop bid documents, or <u>browse files</u></div>
            <div class="dz-sub">Financial statements, certificates, work orders…</div></div>
          <input type="file" id="up-files" accept="application/pdf" multiple class="hidden" />
          <div class="filelist" id="up-flist"></div>
          <div class="row-actions mt"><button class="btn primary" id="up-go" disabled>${icon("upload", 14)} Upload & Index</button></div>
        </div>
      </div>`;
    $("#up-card").scrollIntoView({ behavior: "smooth", block: "nearest" });
    let files = [];
    const refresh = () => {
      $("#up-flist").innerHTML = files.map(f => `<div class="fileitem"><span class="f-ico">${icon("file", 15)}</span>
        <div class="f-name"><b>${esc(f.name)}</b><span>${(f.size / 1024).toFixed(0)} KB</span></div></div>`).join("");
      $("#up-go").disabled = !files.length || !$("#up-name").value.trim();
    };
    $("#up-name").oninput = refresh;
    $("#up-close").onclick = () => $("#t-upload").innerHTML = "";
    const dz = $("#up-dz"), fi = $("#up-files");
    dz.onclick = () => fi.click();
    dz.ondragover = e => { e.preventDefault(); dz.classList.add("drag"); };
    dz.ondragleave = () => dz.classList.remove("drag");
    dz.ondrop = e => { e.preventDefault(); dz.classList.remove("drag"); files = [...files, ...e.dataTransfer.files]; refresh(); };
    fi.onchange = () => { files = [...files, ...fi.files]; refresh(); };
    $("#up-go").onclick = async () => {
      const btn = $("#up-go");
      btn.classList.add("loading"); btn.innerHTML = `<span class="spin"></span> Uploading…`;
      try {
        const fd = new FormData();
        fd.append("bidder_name", $("#up-name").value.trim());
        files.forEach(f => fd.append("files", f));
        await api(`/api/tenders/${t.id}/documents`, { method: "POST", body: fd });
        searchCache.at = 0;
        toast("Bid documents uploaded", "Evidence index rebuilt — ready to analyse");
        tenderView(id);
      } catch (e) { toast("Upload failed", e.message, "err"); btn.classList.remove("loading"); }
    };
  }

  async function loadTenderAudit(tid) {
    const events = await api(`/api/tenders/${tid}/audit`);
    $("#t-audit").innerHTML = events.length ? timelineHtml(events) : '<div class="empty">No events.</div>';
  }
}

function timelineHtml(events) {
  return `<div class="timeline">${events.map(e => {
    const [ic, label] = EVENT_META[e.event] || ["clock", e.event.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase())];
    return `<div class="tl-item ${/completed|extracted|executed/.test(e.event) ? "ok" : ""}">
      <span class="tl-dot">${icon(ic, 11)}</span>
      <div class="tl-head"><b>${esc(label)}</b><span class="when">${fmtTime(e.ts)}</span></div>
      <p>${esc(e.detail)}</p></div>`;
  }).join("")}</div>`;
}

/* ------------------------------------------------------------------ ANALYSIS VIEW */

let currentAnalysis = null;

async function analysisView(id) {
  const a = await api(`/api/analyses/${id}`);
  currentAnalysis = a;
  const evidenceFound = a.results.filter(r => r.evidence_doc_name).length;
  const gst = a.verifications.find(v => v.kind === "GST");

  view.innerHTML = `
    <div class="card tender-hero">
      <div style="min-width:0">
        <div class="eyebrow">Bid Analysis</div>
        <h1>${esc(a.bidder_name)}</h1>
        <div class="ref"><a href="#/tender/${a.tender_id}">${esc(a.tender_title)}</a> · ${esc(a.tender_ref || "")} · analysed ${fmtDateTime(a.created_at)}</div>
      </div>
      <div class="row-actions">
        <a class="btn" href="#/tender/${a.tender_id}">${icon("arrow", 14)} Tender</a>
        <a class="btn primary" href="#/report/${a.id}">${icon("report", 14)} Generate Report</a>
      </div>
    </div>

    <div class="grid main-split mt">
      <div class="card score-card">
        ${scoreBlock(a)}
      </div>
      <div class="metric-tiles" style="grid-template-columns:1fr 1fr">
        <div class="mtile"><div class="m-lbl">${icon("files", 13)} Documents Processed</div><div class="m-val">${a.n_documents}</div><div class="m-sub">bid PDFs indexed</div></div>
        <div class="mtile"><div class="m-lbl">${icon("eye", 13)} Evidence Found</div><div class="m-val">${evidenceFound}/${a.results.length}</div><div class="m-sub">requirements with evidence</div></div>
        <div class="mtile"><div class="m-lbl">${icon("layers", 13)} Requirements</div><div class="m-val">${a.results.length}</div><div class="m-sub">evaluated by rule engine</div></div>
        <div class="mtile"><div class="m-lbl">${icon("shield", 13)} Verification</div><div class="m-val" style="font-size:13.5px">${gst ? (gst.status === "VERIFIED" ? '<span class="chip ok">' + icon("check", 11) + " GST Verified</span>" : '<span class="chip warn">' + esc(gst.status) + "</span>") : '<span class="chip mut">None</span>'}</div><div class="m-sub">${gst ? esc(gst.reference) : "no identifiers found"}</div></div>
      </div>
    </div>

    <div class="section-title">${icon("target", 16)} Requirement Analysis</div>
    <div class="req-list" id="a-reqs">
      ${a.results.map(r => reqCard({
        code: r.requirement_code, title: r.requirement_title, description: r.requirement_desc,
        evidence_required: r.evidence_required, source_clause: r.source_clause,
        req_type: r.req_type, threshold_value: r.threshold_value, threshold_unit: r.threshold_unit,
        comparator: r.comparator,
      }, r)).join("")}
    </div>

    ${a.verifications.length ? `
      <div class="section-title">${icon("shield", 16)} Verification Summary</div>
      <div class="grid cols-2">
        ${a.verifications.map(v => `
          <div class="card"><div class="card-body" style="display:flex;gap:13px;align-items:center">
            <span class="k-ico ${v.status === "VERIFIED" ? "ok" : "warn"}" style="width:36px;height:36px;border-radius:9px;display:grid;place-items:center">${icon(v.status === "VERIFIED" ? "shield" : "shieldOff", 17)}</span>
            <div style="flex:1;min-width:0">
              <b style="font-size:13.5px">${esc(v.kind)} · ${esc(v.reference)}</b>
              <div class="small muted">${esc(v.legal_name || "—")}${v.detail?.registration_status ? " · " + esc(v.detail.registration_status) : ""}${v.detail?.state_jurisdiction ? " · " + esc(v.detail.state_jurisdiction) : ""}</div>
            </div>
            ${v.status === "VERIFIED" ? '<span class="chip ok">' + icon("check", 11) + " VERIFIED</span>" : '<span class="chip warn">' + esc(v.status) + "</span>"}
          </div></div>`).join("")}
      </div>` : ""}

    <div class="section-title">${icon("audit", 16)} Analysis Audit Trail</div>
    <div class="card"><div class="card-body">${timelineHtml(a.audit)}</div></div>`;

  bindReqToggles($("#a-reqs"));
  $$("[data-evidence]", view).forEach(b => b.onclick = () => openEvidenceModal(b.dataset.evidence));
}

/* ------------------------------------------------------------------ evidence modal */

function openEvidenceModal(resultId) {
  const a = currentAnalysis;
  if (!a) return;
  const r = a.results.find(x => String(x.id) === String(resultId));
  if (!r) return;
  $("#ev-modal-card").innerHTML = `
    <div class="modal-head">
      <b>Evidence Inspector — ${esc(r.requirement_code)}</b>
      <button class="btn sm ghost" id="ev-close">${icon("x", 14)} Close</button>
    </div>
    <div class="modal-body">
      <div class="ev-grid">
        <div class="ev-pane">
          <h5>${icon("target", 12)} Requirement</h5>
          <div class="p-req">
            <span class="code">${esc(r.requirement_code)}</span>
            <b>${esc(r.requirement_title)}</b>
            <p>${esc(r.requirement_desc || "")}</p>
            <div class="mt-s small muted">Required</div>
            <b style="font-size:13px">${esc(requiredText({ req_type: r.req_type, threshold_value: r.threshold_value, threshold_unit: r.threshold_unit }))}</b>
            ${r.evidence_required?.length ? `<div class="mt-s small muted">Evidence expected</div><div class="mt-s" style="display:flex;flex-wrap:wrap;gap:5px">${r.evidence_required.map(e => `<span class="chip mut">${esc(e)}</span>`).join("")}</div>` : ""}
          </div>
        </div>
        <div class="ev-pane">
          <h5>${icon("eye", 12)} Evidence Extract</h5>
          ${r.evidence_snippet ? `
            <div class="small" style="margin-bottom:8px"><span class="file" style="font-weight:600">${icon("file", 13)} <b>${esc(r.evidence_doc_name)}</b></span> ${r.evidence_page ? `<span class="page" style="font-family:var(--mono);font-size:11px;background:var(--surface-3);border:1px solid var(--line);padding:1px 7px;border-radius:6px">Page ${r.evidence_page}</span>` : ""}</div>
            <div class="ev-snippet">${highlightSnippet(r.evidence_snippet, r.extracted_value)}</div>`
          : `<div class="empty" style="padding:26px 10px"><div class="e-ico">${icon("search", 18)}</div><b>No evidence located</b><p>Nothing in the submission matched this requirement.</p></div>`}
        </div>
        <div class="ev-pane">
          <h5>${icon("zap", 12)} Evaluation</h5>
          <dl class="kv">
            <dt>Extracted</dt><dd><b>${esc(r.extracted_value || "—")}</b></dd>
            <dt>Rule</dt><dd class="small mono">${esc(r.rule_text || "Document presence check")}</dd>
            <dt>Result</dt><dd>${statusChip(r.status)}</dd>
            <dt>Reason</dt><dd class="small">${esc(REASON_TEXT[r.reason] || r.reason || "")}</dd>
          </dl>
          ${r.recommendation ? `<div class="review-note mt-s" style="background:var(--accent-soft);border-color:var(--accent-line);color:var(--accent-strong)">${icon("info", 14)} <span>${esc(r.recommendation)}</span></div>` : ""}
          ${r.status === "REVIEW_REQUIRED" ? `<div class="review-note mt-s">${icon("alert", 14)} <span><b>Human review required.</b> AI assists, the officer decides.</span></div>` : ""}
        </div>
      </div>
    </div>`;
  $("#ev-modal").classList.add("open");
  $("#ev-close").onclick = closeEvidenceModal;
}
function closeEvidenceModal() { $("#ev-modal").classList.remove("open"); }
document.addEventListener("keydown", e => { if (e.key === "Escape") { closeEvidenceModal(); closePops(); } });
$("#ev-modal").addEventListener("click", e => { if (e.target.id === "ev-modal") closeEvidenceModal(); });

/* ------------------------------------------------------------------ REPORT */

async function reportView(id) {
  const rpt = await api(`/api/analyses/${id}/report`);
  view.innerHTML = `
    <div class="row-actions no-print mb" style="justify-content:flex-end">
      <a class="btn" href="#/analysis/${id}">${icon("arrow", 14)} Back to Analysis</a>
      <button class="btn primary" id="rpt-print">${icon("printer", 14)} Print / Save as PDF</button>
    </div>
    <div class="report-page">
      <div class="card card-body" style="padding:30px 34px">
        <div class="rpt-head">
          <div class="r-brand">
            <div class="r-mark">${icon("shield", 19)}</div>
            <div>
              <h2>COMPLY<b>GeM</b></h2>
              <div class="r-doc">Bid Compliance Assessment</div>
            </div>
          </div>
          <div class="r-meta">
            <b>${esc(rpt.report_id)}</b><br/>
            Generated ${fmtDateTime(rpt.generated_at)}<br/>
            Prototype v0.1
          </div>
        </div>

        <div class="rpt-parties">
          <div class="rpt-box"><div class="k">Tender</div><div class="v">${esc(rpt.tender.title)}</div><div class="s mono">${esc(rpt.tender.ref_no || "")}</div></div>
          <div class="rpt-box"><div class="k">Bidder</div><div class="v">${esc(rpt.bidder.name)}</div><div class="s">${rpt.bidder.gstin ? "GSTIN " + esc(rpt.bidder.gstin) : ""}${rpt.bidder.pan ? " · PAN " + esc(rpt.bidder.pan) : ""}</div></div>
          <div class="rpt-box"><div class="k">Assessment Date</div><div class="v">${fmtDate(rpt.generated_at)}</div><div class="s">Automated evaluation</div></div>
        </div>

        <div class="rpt-score">
          <div class="score-block">
            <div class="sb-top"><span class="eyebrow">Overall Compliance</span>
              <span class="chip ${rpt.summary.verdict === "GOOD" ? "ok" : rpt.summary.verdict === "REVIEW" ? "warn" : "bad"}">${esc(rpt.summary.verdict)}</span></div>
            <div class="sb-num" style="color:${scoreColor(rpt.summary.verdict)}">${rpt.summary.score}<span>%</span></div>
            <div class="sb-sub">${rpt.summary.n_compliant} of ${rpt.summary.n_compliant + rpt.summary.n_review + rpt.summary.n_non_compliant} requirements satisfied</div>
            ${segbarHtml(rpt.summary.n_compliant, rpt.summary.n_review, rpt.summary.n_non_compliant, "lg")}
            <div class="sb-counts">
              <span><i class="dot ok"></i> ${rpt.summary.n_compliant} Compliant</span>
              <span><i class="dot warn"></i> ${rpt.summary.n_review} Review</span>
              <span><i class="dot bad"></i> ${rpt.summary.n_non_compliant} Non-Compliant</span>
            </div>
            <div class="chip ${rpt.summary.verdict === "GOOD" ? "ok" : rpt.summary.verdict === "REVIEW" ? "warn" : "bad"} mt-s" style="align-self:flex-start">${icon("info", 11)} ${esc(rpt.summary.recommendation)}</div>
          </div>
        </div>

        <div class="section-title">${icon("target", 16)} Requirement-wise Findings</div>
        <div class="table-wrap" style="border:1px solid var(--line);border-radius:10px">
          <table class="table">
            <thead><tr><th>Requirement</th><th>Evidence</th><th>Result</th><th>Reason</th></tr></thead>
            <tbody>${rpt.results.map(r => `
              <tr>
                <td><span class="t-title">${esc(r.requirement_title)}</span><div class="t-sub mono">${esc(r.requirement_code)}${r.extracted_value ? " · found " + esc(r.extracted_value) : ""}</div></td>
                <td class="small">${r.evidence_doc_name ? `${esc(r.evidence_doc_name)}${r.evidence_page ? ` <span class="muted">· p.${r.evidence_page}</span>` : ""}` : '<span class="muted">Not found</span>'}</td>
                <td>${statusChip(r.status)}</td>
                <td class="small muted">${esc(REASON_TEXT[r.reason] || r.reason || "")}</td>
              </tr>`).join("")}</tbody>
          </table>
        </div>

        <div class="rpt-verify">
          <div class="eyebrow">Verification Summary</div>
          ${rpt.verifications.map(v => `<div class="small" style="margin-top:6px"><b>${esc(v.kind)} ${esc(v.reference)}</b> — ${v.status === "VERIFIED" ? '<span style="color:var(--ok);font-weight:650">VERIFIED</span>' : esc(v.status)}${v.legal_name ? " · " + esc(v.legal_name) : ""}</div>`).join("") || '<div class="small muted">No identifiers were verified.</div>'}
          <div class="small muted mt-s">Verification services are provided by a deterministic mock in this prototype; the API contract matches a live government integration.</div>
        </div>

        <div class="section-title">${icon("audit", 16)} Assessment Trail</div>
        <div class="timeline">${rpt.audit ? rpt.audit.map(e => `
          <div class="tl-item"><span class="tl-dot">${icon("clock", 11)}</span>
            <div class="tl-head"><b>${esc(e.event.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase()))}</b><span class="when">${fmtTime(e.ts)}</span></div>
            <p>${esc(e.detail)}</p></div>`).join("") : ""}</div>

        <div class="rpt-sign">
          <div class="sig">Procurement Officer — Signature &amp; Date<br/><span class="small">AI assists. The officer decides.</span></div>
          <div class="sig">Approving Authority</div>
        </div>

        <div class="rpt-foot">
          This report was generated automatically by ComplyGeM. Numeric thresholds, document presence and dates were evaluated by a deterministic rule engine; extracted values are traceable to the cited evidence pages.
        </div>
      </div>
    </div>`;
  $("#rpt-print").onclick = () => window.print();
}

/* ------------------------------------------------------------------ top bar: search & notifications */

const searchInput = $("#global-search");
const searchPop = $("#search-pop");

searchInput.addEventListener("input", () => renderSearch());
searchInput.addEventListener("focus", () => renderSearch());

function renderSearch() {
  const q = searchInput.value.trim().toLowerCase();
  if (!searchCache.data || Date.now() - searchCache.at > 30000) {
    api("/api/tenders").then(d => { searchCache.data = d; searchCache.at = Date.now(); renderSearch(); }).catch(() => {});
  }
  const items = (searchCache.data || []).filter(t =>
    !q || t.title.toLowerCase().includes(q) || (t.ref_no || "").toLowerCase().includes(q)).slice(0, 6);
  searchPop.innerHTML = items.length ? items.map(t => `
    <div class="s-item" data-href="#/tender/${t.id}">
      <span class="k-ico" style="width:30px;height:30px;border-radius:8px;background:var(--accent-soft);color:var(--accent);display:grid;place-items:center">${icon("tender", 14)}</span>
      <div style="min-width:0"><b>${esc(t.title)}</b><span>${esc(t.ref_no || "no reference")} · ${t.n_requirements} requirements</span></div>
    </div>`).join("")
  : `<div class="s-empty">${q ? "No tenders match your search." : "Start typing to search tenders."}</div>`;
  searchPop.classList.add("open");
  $$(".s-item", searchPop).forEach(el => el.onclick = () => {
    location.hash = el.dataset.href;
    searchPop.classList.remove("open");
    searchInput.value = "";
    searchInput.blur();
  });
}
document.addEventListener("click", e => {
  if (!e.target.closest(".top-search")) searchPop.classList.remove("open");
  if (!e.target.closest("#notif-btn") && !e.target.closest("#notif-pop")) $("#notif-pop").classList.remove("open");
});
function closePops() { searchPop.classList.remove("open"); $("#notif-pop").classList.remove("open"); }

$("#notif-btn").addEventListener("click", async () => {
  const pop = $("#notif-pop");
  if (pop.classList.contains("open")) { pop.classList.remove("open"); return; }
  pop.innerHTML = `<div class="n-head">Notifications <span class="chip mut">live audit feed</span></div><div style="padding:20px" class="sk sk-line w80"></div>`;
  pop.classList.add("open");
  try {
    const events = await api("/api/audit?limit=8");
    pop.innerHTML = `<div class="n-head">Notifications <span class="hint">latest ${events.length} events</span></div>` +
      (events.map(e => {
        const [ic] = EVENT_META[e.event] || ["clock"];
        return `<div class="n-item"><span class="n-ico">${icon(ic, 14)}</span>
          <div style="flex:1;min-width:0"><b>${esc(e.event.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase()))}</b><p>${esc(e.detail)}</p></div>
          <span class="when">${timeAgo(e.ts)}</span></div>`;
      }).join("") || '<div class="s-empty">No events yet.</div>');
    const recent = events.filter(e => Date.now() - new Date(e.ts).getTime() < 30 * 60 * 1000).length;
    const badge = $("#notif-badge");
    badge.textContent = Math.min(recent, 9);
    badge.classList.toggle("hidden", recent === 0);
  } catch { pop.innerHTML = '<div class="s-empty">Notifications unavailable.</div>'; }
});

/* ------------------------------------------------------------------ boot */

$$("[data-ic]").forEach(el => el.innerHTML = icon(el.dataset.ic, 17));
$("#brand-mark").innerHTML = icon("shield", 20);
$("#brand-mark").style.color = "#fff";

window.addEventListener("hashchange", route);
route();
