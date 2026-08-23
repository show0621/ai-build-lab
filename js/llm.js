/* LLM advanced page interactions */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ---------- nav toggle (reuse pattern) ---------- */
const navToggle = $("#navToggle");
const navLinks = $("#navLinks");
navToggle?.addEventListener("click", () => {
  const open = navLinks?.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(!!open));
});

/* ---------- AssistiveTouch-style side nav ---------- */
const llmSide = $("#llmSide");
const llmSideOrb = $("#llmSideOrb");
const llmSidePanel = $("#llmSidePanel");
const llmSideCollapse = $("#llmSideCollapse");
const SIDE_KEY = "llm-assist-open";

function setSideOpen(open) {
  if (!llmSide) return;
  llmSide.dataset.open = open ? "true" : "false";
  llmSideOrb?.setAttribute("aria-expanded", String(open));
  llmSidePanel?.setAttribute("aria-hidden", String(!open));
  try {
    localStorage.setItem(SIDE_KEY, open ? "1" : "0");
  } catch (_) {}
}

llmSideOrb?.addEventListener("click", () => setSideOpen(true));
llmSideCollapse?.addEventListener("click", () => setSideOpen(false));

try {
  if (localStorage.getItem(SIDE_KEY) === "1") setSideOpen(true);
} catch (_) {}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && llmSide?.dataset.open === "true") setSideOpen(false);
});

/* ---------- side nav active ---------- */
const sideLinks = $$("#llmSideLinks a");
const sections = sideLinks
  .map((a) => document.querySelector(a.getAttribute("href")))
  .filter(Boolean);

function syncSide() {
  if (!sections.length) return;
  let current = sections[0];
  const y = window.scrollY + 120;
  for (const s of sections) {
    if (s.offsetTop <= y) current = s;
  }
  sideLinks.forEach((a) => {
    a.classList.toggle("active", a.getAttribute("href") === `#${current.id}`);
  });
}
window.addEventListener("scroll", syncSide, { passive: true });
syncSide();

sideLinks.forEach((a) => {
  a.addEventListener("click", () => {
    // keep open after jump so user can keep navigating; optional auto-collapse on mobile
    if (window.matchMedia("(max-width: 700px)").matches) {
      setTimeout(() => setSideOpen(false), 280);
    }
  });
});

/* ---------- static token chips ---------- */
function fillChips(el, tokens) {
  if (!el) return;
  el.innerHTML = tokens.map((t) => `<span class="llm-tok">${t}</span>`).join("");
}
fillChips($("#tokenZh"), ["受測", "個體", "應", "如何", "選擇", "？"]);
fillChips($("#tokenEn"), ["Transfer", " pricing", " report"]);

/* ---------- embedding canvas ---------- */
function drawEmbedCanvas() {
  const canvas = $("#embedCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = 720;
  const h = 180;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);

  const points = [
    { x: 120, y: 90, label: "受測", c: "#0d9f93" },
    { x: 155, y: 70, label: "個體", c: "#0284c7" },
    { x: 190, y: 105, label: "功能", c: "#059669" },
    { x: 480, y: 55, label: "TNMM", c: "#d97706" },
    { x: 520, y: 120, label: "利潤率", c: "#b45309" },
    { x: 560, y: 80, label: "無形資產", c: "#64748b" },
  ];

  // soft clusters
  ctx.fillStyle = "rgba(13,159,147,0.08)";
  ctx.beginPath();
  ctx.ellipse(160, 90, 90, 55, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(217,119,6,0.08)";
  ctx.beginPath();
  ctx.ellipse(520, 85, 95, 55, 0, 0, Math.PI * 2);
  ctx.fill();

  points.forEach((p) => {
    ctx.beginPath();
    ctx.fillStyle = p.c;
    ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#334155";
    ctx.font = "12px Outfit, sans-serif";
    ctx.fillText(p.label, p.x + 10, p.y + 4);
  });

  ctx.strokeStyle = "rgba(13,159,147,0.35)";
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(120, 90);
  ctx.lineTo(155, 70);
  ctx.lineTo(190, 105);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = "#64748b";
  ctx.font = "11px JetBrains Mono, monospace";
  ctx.fillText("相近概念群集（示意）", 16, 22);
}
drawEmbedCanvas();

/* ---------- focus attention click demo ---------- */
const FOCUS_TOKENS = ["受測個體", "應", "選擇", "功能", "較", "單純", "之一方"];
const FOCUS_WEIGHTS = {
  一方: { 受測個體: 0.85, 功能: 0.7, 單純: 0.65, 選擇: 0.4, 應: 0.15, 較: 0.2 },
  其: { 受測個體: 0.9, 功能: 0.35, 單純: 0.25 },
};

function initFocusDemo() {
  const row = $("#focusTokens");
  const svg = $("#focusSvg");
  const cap = $("#focusCaption");
  if (!row || !svg) return;

  const tokens = [...FOCUS_TOKENS];
  row.innerHTML = tokens
    .map((t, i) => `<button type="button" class="llm-tok clickable" data-i="${i}">${t}</button>`)
    .join("");

  const W = 640;
  const positions = tokens.map((_, i) => ({
    x: 40 + (i * (W - 80)) / Math.max(tokens.length - 1, 1),
    y: 40,
  }));

  function draw(activeIdx) {
    const focusLabel = tokens[activeIdx];
    const weights =
      focusLabel.includes("一方")
        ? { 受測個體: 0.9, 功能: 0.75, 單純: 0.7, 選擇: 0.45, 應: 0.2, 較: 0.25 }
        : focusLabel === "單純"
          ? { 功能: 0.8, 一方: 0.55, 選擇: 0.4, 受測個體: 0.35 }
          : focusLabel === "受測個體"
            ? { 選擇: 0.5, 功能: 0.45, 一方: 0.6, 單純: 0.3 }
            : { 受測個體: 0.55, 功能: 0.4, 單純: 0.35 };

    let lines = "";
    tokens.forEach((t, i) => {
      if (i === activeIdx) return;
      const w = weights[t] || weights[t.replace(/^之/, "")] || 0.12;
      const x1 = positions[activeIdx].x;
      const y1 = 48;
      const x2 = positions[i].x;
      const y2 = 120;
      const midY = 80;
      const opacity = 0.15 + w * 0.75;
      const width = 1 + w * 4;
      lines += `<path d="M${x1} ${y1} Q${(x1 + x2) / 2} ${midY} ${x2} ${y2}" fill="none" stroke="#0d9f93" stroke-width="${width}" opacity="${opacity}" />`;
      lines += `<circle cx="${x2}" cy="${y2}" r="${4 + w * 5}" fill="#0284c7" opacity="${opacity}" />`;
    });

    const nodes = tokens
      .map((t, i) => {
        const isA = i === activeIdx;
        return `<g>
          <rect x="${positions[i].x - 36}" y="22" width="72" height="28" rx="8" fill="${isA ? "#fff7ed" : "#fff"}" stroke="${isA ? "#d97706" : "#e2e8f0"}"/>
          <text x="${positions[i].x}" y="40" text-anchor="middle" font-size="11" font-family="Outfit,sans-serif" fill="#0f172a">${t}</text>
        </g>`;
      })
      .join("");

    svg.innerHTML = lines + nodes;
    if (cap) {
      cap.textContent = `焦點「${focusLabel}」：線愈粗／愈不透明，表示 Attention 示意權重愈高（教學用）。`;
    }
    $$(".llm-tok", row).forEach((b, i) => b.classList.toggle("focus", i === activeIdx));
  }

  row.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-i]");
    if (!btn) return;
    draw(Number(btn.dataset.i));
  });
  draw(tokens.length - 1);
}
initFocusDemo();

/* ---------- probability helpers ---------- */
const BASE_PROBS = [
  { t: "功能", p: 0.35 },
  { t: "公司", p: 0.18 },
  { t: "應", p: 0.12 },
  { t: "承擔", p: 0.1 },
  { t: "交易", p: 0.08 },
  { t: "其他", p: 0.17 },
];

const NEXT_PROBS = [
  { t: "單純", p: 0.63 },
  { t: "低", p: 0.12 },
  { t: "簡單", p: 0.08 },
  { t: "少", p: 0.05 },
  { t: "其他", p: 0.12 },
];

function renderBars(el, items, { pick = null, dimOthers = false } = {}) {
  if (!el) return;
  el.innerHTML = items
    .map(
      (it) => `
    <div class="llm-prob-row${pick === it.t ? " picked" : ""}${dimOthers && pick && pick !== it.t ? " dim" : ""}" data-t="${it.t}">
      <span>${it.t}</span>
      <span class="bar"><i style="width:${Math.round(it.p * 100)}%"></i></span>
      <span class="pct">${Math.round(it.p * 100)}%</span>
    </div>`
    )
    .join("");
  // force reflow for transition from 0 if needed
  requestAnimationFrame(() => {
    $$(".llm-prob-row .bar > i", el).forEach((i) => {
      const row = i.closest("[data-t]");
      const item = items.find((x) => x.t === row?.dataset.t);
      if (item) i.style.width = `${Math.round(item.p * 100)}%`;
    });
  });
}

renderBars($("#probStatic"), NEXT_PROBS, { pick: "單純" });

/* ---------- sampling knobs ---------- */
function softmaxTemp(items, temperature) {
  const t = Math.max(temperature, 0.05);
  const logits = items.map((it) => Math.log(Math.max(it.p, 1e-6)) / t);
  const max = Math.max(...logits);
  const exps = logits.map((l) => Math.exp(l - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return items.map((it, i) => ({ t: it.t, p: exps[i] / sum }));
}

function applyTopK(items, k) {
  const sorted = [...items].sort((a, b) => b.p - a.p);
  const keep = new Set(sorted.slice(0, k).map((x) => x.t));
  const filtered = items.filter((x) => keep.has(x.t));
  const sum = filtered.reduce((a, b) => a + b.p, 0) || 1;
  return filtered.map((x) => ({ t: x.t, p: x.p / sum }));
}

function applyTopP(items, p) {
  const sorted = [...items].sort((a, b) => b.p - a.p);
  let acc = 0;
  const keep = [];
  for (const it of sorted) {
    keep.push(it);
    acc += it.p;
    if (acc >= p) break;
  }
  const set = new Set(keep.map((x) => x.t));
  const filtered = items.filter((x) => set.has(x.t));
  const sum = filtered.reduce((a, b) => a + b.p, 0) || 1;
  return filtered.map((x) => ({ t: x.t, p: x.p / sum }));
}

function updateSample() {
  const temp = Number($("#tempRange")?.value || 0.15);
  const topk = Number($("#topkRange")?.value || 5);
  const topp = Number($("#toppRange")?.value || 0.9);
  if ($("#tempOut")) $("#tempOut").textContent = temp.toFixed(2);
  if ($("#topkOut")) $("#topkOut").textContent = String(topk);
  if ($("#toppOut")) $("#toppOut").textContent = topp.toFixed(2);

  let items = softmaxTemp(BASE_PROBS, temp);
  items = applyTopK(items, topk);
  items = applyTopP(items, topp);
  const pick = [...items].sort((a, b) => b.p - a.p)[0]?.t;
  renderBars($("#sampleBars"), items, { pick });
  const hint = $("#sampleHint");
  if (hint) {
    hint.textContent =
      temp < 0.3
        ? "低溫：分布較尖，較常選最高機率（查核／法規語氣較穩）。"
        : temp < 0.8
          ? "中溫：仍偏穩，但次高候選較有機會被抽到。"
          : "高溫：分布變平，變化大——創意寫作可以，TP 查核通常不建議。";
  }
}

["tempRange", "topkRange", "toppRange"].forEach((id) => {
  $(`#${id}`)?.addEventListener("input", updateSample);
});
updateSample();

/* ---------- rerank viz ---------- */
const RERANK_ITEMS = [
  { t: "受測個體選擇原則", s: 92 },
  { t: "功能風險分析", s: 88 },
  { t: "可比較公司選擇", s: 84 },
  { t: "TNMM", s: 81 },
  { t: "利潤率分析", s: 78 },
  { t: "無形資產評價", s: 55 },
];

function initRerank() {
  const before = $("#rerankBefore");
  const after = $("#rerankAfter");
  if (!before || !after) return;
  before.innerHTML = RERANK_ITEMS.map((x) => `<li data-t="${x.t}">${x.t} · ${x.s}%</li>`).join("");
  after.innerHTML = "";

  $("#rerankPlay")?.addEventListener("click", () => {
    const keep = new Set(["受測個體選擇原則", "功能風險分析", "可比較公司選擇", "利潤率分析", "TNMM"]);
    $$("#rerankBefore li").forEach((li) => {
      const ok = keep.has(li.dataset.t);
      li.classList.toggle("keep", ok);
      li.classList.toggle("drop", !ok);
    });
    after.innerHTML = RERANK_ITEMS.filter((x) => keep.has(x.t))
      .slice(0, 5)
      .map((x, i) => `<li class="keep">${i + 1}. ${x.t}</li>`)
      .join("");
  });
}
initRerank();

/* ---------- pipeline animation ---------- */
const PIPE_TOKENS = ["受測", "個體", "應", "如何", "選擇"];
const PIPE_GEN = ["較", "單純"]; // 「功能」已在第 5 步選出，這裡只接續後續 token

let pipeTimer = null;
let pipePaused = false;
let pipeStep = 0;

function setPipeStatus(t) {
  const el = $("#pipeStatus");
  if (el) el.textContent = t;
}

function drawAttnSvg(focusIdx, mode = "predict") {
  const svg = $("#attnSvg");
  if (!svg) return;
  // mode: scan | filter | link | predict
  // Dense word-cloud: words stay in place — no collapse-to-center
  const tokens = PIPE_TOKENS;
  const W = 860;
  const H = 480;
  const focus = Math.min(Math.max(focusIdx, 0), tokens.length - 1);
  const focusTok = tokens[focus];

  const showFilter = mode === "filter" || mode === "link" || mode === "predict";
  const showLinks = mode === "link" || mode === "predict";
  const showPredict = mode === "predict";

  // Dense literary / Web2.0-like cloud positions (normalized)
  // related: TP domain; noise: distractors
  const cloud = [
    // —— related (scattered, not clustered in one blob) ——
    { t: "受測個體", rel: 0.94, x: 0.22, y: 0.28, s: 26, c: "#0f766e" },
    { t: "功能", rel: 0.9, x: 0.62, y: 0.22, s: 24, c: "#0369a1" },
    { t: "風險", rel: 0.84, x: 0.78, y: 0.38, s: 22, c: "#c2410c" },
    { t: "移轉訂價", rel: 0.88, x: 0.38, y: 0.18, s: 20, c: "#15803d" },
    { t: "單純", rel: 0.78, x: 0.48, y: 0.55, s: 20, c: "#a16207" },
    { t: "選擇", rel: 0.86, x: 0.55, y: 0.36, s: 22, c: "#1e3a5f" },
    { t: "TNMM", rel: 0.66, x: 0.18, y: 0.52, s: 17, c: "#0369a1" },
    { t: "可比公司", rel: 0.62, x: 0.82, y: 0.22, s: 15, c: "#9f1239" },
    { t: "利潤率", rel: 0.55, x: 0.7, y: 0.58, s: 15, c: "#0f766e" },
    { t: "OECD", rel: 0.5, x: 0.12, y: 0.2, s: 14, c: "#1d4ed8" },
    { t: "一方", rel: 0.58, x: 0.32, y: 0.62, s: 14, c: "#b45309" },
    { t: "資產", rel: 0.45, x: 0.88, y: 0.5, s: 13, c: "#334155" },
    { t: "查核準則", rel: 0.42, x: 0.58, y: 0.14, s: 13, c: "#0e7490" },
    { t: "函釋", rel: 0.4, x: 0.28, y: 0.42, s: 13, c: "#7c3aed" },
    { t: "BAPA", rel: 0.38, x: 0.42, y: 0.72, s: 13, c: "#0369a1" },
    { t: "個體", rel: 0.72, x: 0.5, y: 0.28, s: 16, c: "#0f766e" },
    { t: "交易", rel: 0.44, x: 0.68, y: 0.44, s: 13, c: "#57534e" },
    { t: "利潤", rel: 0.4, x: 0.24, y: 0.72, s: 12, c: "#15803d" },
    // —— distractors (many, fill the cloud) ——
    { t: "台積電", rel: 0.04, x: 0.08, y: 0.12, s: 15, c: "#a8a29e" },
    { t: "鴻海", rel: 0.04, x: 0.92, y: 0.12, s: 14, c: "#a8a29e" },
    { t: "永續", rel: 0.05, x: 0.14, y: 0.38, s: 14, c: "#a8a29e" },
    { t: "ETF", rel: 0.04, x: 0.9, y: 0.68, s: 14, c: "#a8a29e" },
    { t: "疫苗", rel: 0.03, x: 0.08, y: 0.68, s: 13, c: "#a8a29e" },
    { t: "高股息", rel: 0.04, x: 0.74, y: 0.12, s: 12, c: "#a8a29e" },
    { t: "美食", rel: 0.02, x: 0.94, y: 0.42, s: 12, c: "#a8a29e" },
    { t: "旅遊", rel: 0.02, x: 0.06, y: 0.48, s: 12, c: "#a8a29e" },
    { t: "籃球", rel: 0.02, x: 0.86, y: 0.78, s: 11, c: "#a8a29e" },
    { t: "天氣", rel: 0.01, x: 0.48, y: 0.86, s: 11, c: "#a8a29e" },
    { t: "零碳", rel: 0.05, x: 0.16, y: 0.82, s: 12, c: "#a8a29e" },
    { t: "貼文", rel: 0.02, x: 0.36, y: 0.08, s: 11, c: "#a8a29e" },
    { t: "指數", rel: 0.05, x: 0.64, y: 0.8, s: 12, c: "#a8a29e" },
    { t: "國泰", rel: 0.03, x: 0.78, y: 0.7, s: 12, c: "#a8a29e" },
    { t: "富邦", rel: 0.03, x: 0.2, y: 0.08, s: 12, c: "#a8a29e" },
    { t: "公司治理", rel: 0.06, x: 0.88, y: 0.3, s: 11, c: "#a8a29e" },
    { t: "半導體", rel: 0.04, x: 0.1, y: 0.3, s: 11, c: "#a8a29e" },
    { t: "定期定額", rel: 0.03, x: 0.34, y: 0.88, s: 11, c: "#a8a29e" },
    { t: "Podcast", rel: 0.02, x: 0.56, y: 0.08, s: 11, c: "#a8a29e" },
    { t: "設計", rel: 0.03, x: 0.72, y: 0.86, s: 12, c: "#a8a29e" },
    { t: "Usability", rel: 0.02, x: 0.42, y: 0.48, s: 10, c: "#a8a29e" },
    { t: "Participation", rel: 0.02, x: 0.6, y: 0.68, s: 10, c: "#a8a29e" },
    { t: "RSS", rel: 0.02, x: 0.26, y: 0.56, s: 10, c: "#a8a29e" },
    { t: "AJAX", rel: 0.02, x: 0.84, y: 0.58, s: 10, c: "#a8a29e" },
    { t: "簡報", rel: 0.02, x: 0.14, y: 0.6, s: 11, c: "#a8a29e" },
    { t: "咖啡", rel: 0.01, x: 0.96, y: 0.55, s: 11, c: "#a8a29e" },
  ];

  // Mark input focus & next-stage candidates as special anchors in the cloud
  cloud.forEach((w) => {
    if (w.t === focusTok || w.t.includes(focusTok)) {
      w.rel = Math.max(w.rel, 0.95);
      w.isFocus = true;
    }
  });
  // Ensure focus token exists as a node if missing
  if (!cloud.some((w) => w.isFocus)) {
    cloud.push({ t: focusTok, rel: 0.98, x: 0.48, y: 0.4, s: 24, c: "#1e3a5f", isFocus: true });
  }

  const nextPred = [
    { t: "功能", p: 0.35 },
    { t: "較", p: 0.18, x: 0.52, y: 0.64, s: 16, c: "#0d9488", isNext: true },
    { t: "單純", p: 0.14 },
    { t: "風險", p: 0.1 },
    { t: "一方", p: 0.08 },
  ];
  // Place "較" as a next-stage word elsewhere if not present
  if (!cloud.some((w) => w.t === "較")) {
    cloud.push({ t: "較", rel: 0.2, x: 0.52, y: 0.64, s: 16, c: "#0d9488", isNext: true });
  }

  const related = [...cloud].filter((w) => w.rel >= 0.35).sort((a, b) => b.rel - a.rel);
  const focusNode = cloud.find((w) => w.isFocus) || related[0];

  const phaseHint =
    mode === "scan"
      ? "① 快速掃描龐大詞庫…"
      : mode === "filter"
        ? "② 相關變亮、無關淡化（位置不變）"
        : mode === "link"
          ? "③ 串接相關詞並標示機率"
          : "④ 下一階段候選散落點亮";

  const defs = `<defs>
    <linearGradient id="paperGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#faf7f0"/>
      <stop offset="100%" stop-color="#f0ebe1"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#paperGrad)" rx="16"/>`;

  const title = `<text x="${W / 2}" y="28" text-anchor="middle" font-family="Outfit,sans-serif" font-size="15" fill="#1e3a5f" font-weight="600">文字雲詞庫 · 快速搜尋 · 串接機率</text>
  <text x="${W / 2}" y="48" text-anchor="middle" font-family="Outfit,sans-serif" font-size="12" fill="#0d9488">${phaseHint}</text>`;

  // Rapid search sweep (scan mode)
  let sweep = "";
  if (mode === "scan") {
    sweep = `<rect class="attn-sweep" x="0" y="56" width="48" height="${H - 70}" fill="url(#sweepGrad)" opacity="0.35"/>
    <defs><linearGradient id="sweepGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="rgba(13,148,136,0)"/><stop offset="50%" stop-color="rgba(13,148,136,0.25)"/><stop offset="100%" stop-color="rgba(13,148,136,0)"/>
    </linearGradient></defs>`;
  }

  // Chain links: focus → related[1] → related[2] … (path through cloud, not hub)
  let links = "";
  let pills = "";
  let pulses = "";
  if (showLinks) {
    const chain = [focusNode, ...related.filter((w) => w !== focusNode)].slice(0, 7);
    for (let i = 0; i < chain.length - 1; i++) {
      const a = chain[i];
      const b = chain[i + 1];
      const x1 = a.x * W;
      const y1 = a.y * H;
      const x2 = b.x * W;
      const y2 = b.y * H;
      const mx = (x1 + x2) / 2 + (i % 2 === 0 ? 18 : -18);
      const my = (y1 + y2) / 2;
      const p = b.rel;
      const d = `M${x1} ${y1} Q${mx} ${my} ${x2} ${y2}`;
      const delay = `${0.1 + i * 0.2}s`;
      links += `<path class="attn-ink attn-draw" d="${d}" stroke-width="${1.4 + p * 2.8}" fill="none" stroke="#0d9488" style="--delay:${delay};--op:${0.5 + p * 0.35}"/>`;
      pulses += `<path class="attn-ink-pulse" d="${d}" stroke-width="${1.1 + p}" fill="none" style="--delay:${delay}"/>`;
      pills += `<g class="attn-prob-reveal" style="--delay:${0.25 + i * 0.2}s">
        <rect x="${mx - 18}" y="${my - 9}" width="36" height="16" rx="8" fill="#fffef9" stroke="#5eead4"/>
        <text x="${mx}" y="${my}" text-anchor="middle" dominant-baseline="middle" font-size="10" font-family="JetBrains Mono,monospace" fill="#0f766e" font-weight="600">${Math.round(p * 100)}%</text>
      </g>`;
    }
  }

  // Word cloud — stay put; only brightness/opacity change
  let words = "";
  cloud.forEach((w, i) => {
    const x = w.x * W;
    const y = w.y * H;
    const isRel = w.rel >= 0.35;
    let cls = "attn-cloud-word";
    if (mode === "scan") cls += " is-scanning";
    else if (showFilter) cls += isRel ? " is-related" : " is-unrelated";
    if (w.isFocus) cls += " is-focus";
    if (showPredict && (w.isNext || nextPred.some((n) => n.t === w.t && n.p >= 0.14))) cls += " is-next";
    if (showLinks && isRel) cls += " is-linked";

    // scan flicker delay for mass-search feel
    const scanDelay = `${(i % 12) * 0.05}s`;
    words += `<text class="${cls}" x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle"
      font-size="${w.s}" font-family="Georgia,'Noto Serif TC',serif" font-weight="${w.isFocus || isRel ? 700 : 500}"
      fill="${showFilter && !isRel ? "#c4bfb6" : w.c}"
      style="--d:${6 + (i % 5) * 0.35}s;--delay:${(i % 9) * 0.08}s;--scan:${scanDelay};--i:${i}">${w.t}</text>`;
  });

  // Next predictions as scattered callouts near bottom-right / existing nodes — NOT a collapse
  let predict = "";
  if (showPredict) {
    const spots = [
      { t: "功能", p: 0.35, x: 0.62, y: 0.22 },
      { t: "較", p: 0.18, x: 0.52, y: 0.64 },
      { t: "單純", p: 0.14, x: 0.48, y: 0.55 },
      { t: "風險", p: 0.1, x: 0.78, y: 0.38 },
      { t: "一方", p: 0.08, x: 0.32, y: 0.62 },
    ];
    predict = spots
      .map((s, i) => {
        const x = s.x * W;
        const y = s.y * H - 22;
        return `<g class="attn-next-tag" style="--delay:${0.15 + i * 0.12}s">
          <rect x="${x - 28}" y="${y - 11}" width="56" height="18" rx="9" fill="#fffef9" stroke="#0d9488" stroke-width="1.2"/>
          <text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-size="10" font-family="JetBrains Mono,monospace" fill="#0f766e">下一字 ${Math.round(s.p * 100)}%</text>
        </g>`;
      })
      .join("");
    predict += `<text x="${W / 2}" y="${H - 18}" text-anchor="middle" font-size="12" fill="#57534e" font-family="Outfit,sans-serif">下一階段候選已散落標註（不往中心收縮）· 生成鏈可繼續往外長</text>`;
  } else {
    predict = `<text x="${W / 2}" y="${H - 20}" text-anchor="middle" font-size="12" fill="#78716c" font-family="Outfit,sans-serif">${
      mode === "scan" ? "大量詞彙快速掃過…" : mode === "filter" ? "無關後退淡化，相關留在原位變亮…" : "沿語意路徑串接中…"
    }</text>`;
  }

  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.classList.remove("llm-attn-tech");
  svg.classList.add("llm-attn-literary", "attn-spread");
  svg.dataset.phase = mode;
  svg.innerHTML = defs + title + sweep + links + pulses + words + pills + predict;
}

function runAttnSearchAnimation(focusIdx, onDone) {
  const phases = [
    { mode: "scan", status: "快速大量搜尋詞庫…", wait: 1100 },
    { mode: "filter", status: "相關變亮、無關淡化…", wait: 1000 },
    { mode: "link", status: "串接連結＋機率…", wait: 1700 },
    { mode: "predict", status: "下一階段散落標註…", wait: 1300 },
  ];
  let i = 0;
  const tick = () => {
    if (pipePaused) return;
    if (i >= phases.length) {
      if (onDone) onDone();
      return;
    }
    const ph = phases[i];
    setPipeStatus(`語意搜尋 ${i + 1}/${phases.length} · ${ph.status}`);
    drawAttnSvg(focusIdx, ph.mode);
    i += 1;
    schedule(tick, ph.wait);
  };
  tick();
}

function renderPipeTokens(active = -1) {
  const el = $("#pipeTokens");
  if (!el) return;
  el.innerHTML = PIPE_TOKENS.map(
    (t, i) => `<span class="llm-tok${i === active ? " on" : ""}">${t}</span>`
  ).join("");
}

function clearPipeTimer() {
  if (pipeTimer) {
    clearTimeout(pipeTimer);
    pipeTimer = null;
  }
}

function schedule(fn, ms) {
  clearPipeTimer();
  pipeTimer = setTimeout(() => {
    if (pipePaused) return;
    fn();
  }, ms);
}

function runPipeline(fromStep = 0) {
  pipePaused = false;
  pipeStep = fromStep;
  const out = $("#pipeOut");
  const bars = $("#probBars");

  const steps = [
    () => {
      setPipeStatus("1/6 Token 化");
      renderPipeTokens(-1);
      PIPE_TOKENS.forEach((_, i) => {
        setTimeout(() => renderPipeTokens(i), 180 * (i + 1));
      });
      if (out) out.textContent = "（輸入已切成 Token）";
      renderBars(bars, BASE_PROBS.map((x) => ({ ...x, p: 0.01 })));
      highlightChain(1);
      schedule(() => runStep(1), 1200);
    },
    () => {
      setPipeStatus("語意搜尋開始…");
      highlightChain(2);
      runAttnSearchAnimation(4, () => {
        if (pipePaused) return;
        highlightChain(3);
        $$("#pipeTokens .llm-tok").forEach((el, i) => {
          el.classList.toggle("on", i === 0 || i === 1 || i === 4);
        });
        schedule(() => runStep(2), 400);
      });
    },
    () => {
      setPipeStatus("計算下一個 Token 機率分布");
      highlightChain(4);
      renderBars(bars, BASE_PROBS);
      schedule(() => runStep(3), 1000);
    },
    () => {
      setPipeStatus("選出「功能」");
      highlightChain(5);
      renderBars(bars, BASE_PROBS, { pick: "功能", dimOthers: true });
      if (out) out.textContent = "受測個體應如何選擇？功能";
      schedule(() => runStep(4), 1000);
    },
    () => {
      setPipeStatus("重複：再預測「較」「單純」…");
      highlightChain(6);
      let built = "受測個體應如何選擇？功能";
      let i = 0;
      const tick = () => {
        if (pipePaused) return;
        if (i >= PIPE_GEN.length) {
          setPipeStatus("完成 · 可再按播放");
          if (out) out.textContent = built + "…（示意）";
          renderBars(bars, NEXT_PROBS, { pick: "單純" });
          return;
        }
        built += PIPE_GEN[i];
        if (out) out.textContent = built;
        const dist =
          i === PIPE_GEN.length - 1
            ? NEXT_PROBS
            : [
                { t: PIPE_GEN[i], p: 0.51 },
                { t: "及", p: 0.17 },
                { t: "與", p: 0.12 },
                { t: "其他", p: 0.2 },
              ];
        renderBars(bars, dist, { pick: PIPE_GEN[i], dimOthers: true });
        i += 1;
        schedule(tick, 850);
      };
      tick();
    },
  ];

  function runStep(n) {
    pipeStep = n;
    if (n < steps.length) steps[n]();
  }

  runStep(fromStep);
}

function highlightChain(step) {
  $$("#llmChain .llm-chain-step").forEach((el) => {
    el.classList.toggle("active", Number(el.dataset.step) === step);
  });
}

$("#pipePlay")?.addEventListener("click", () => {
  clearPipeTimer();
  runPipeline(0);
});
$("#pipePause")?.addEventListener("click", () => {
  pipePaused = true;
  clearPipeTimer();
  setPipeStatus("已暫停");
});
$("#pipeReset")?.addEventListener("click", () => {
  pipePaused = true;
  clearPipeTimer();
  renderPipeTokens(-1);
  $("#attnSvg").innerHTML = "";
  renderBars($("#probBars"), BASE_PROBS.map((x) => ({ ...x, p: 0 })));
  if ($("#pipeOut")) $("#pipeOut").textContent = "（尚未開始）";
  setPipeStatus("就緒");
  $$("#llmChain .llm-chain-step").forEach((el) => el.classList.remove("active"));
});

$("#llmPlayAll")?.addEventListener("click", () => {
  document.getElementById("pipeline")?.scrollIntoView({ behavior: "smooth" });
  setTimeout(() => runPipeline(0), 400);
});

// initial empty bars
renderBars(
  $("#probBars"),
  BASE_PROBS.map((x) => ({ ...x, p: 0.02 }))
);
renderPipeTokens(-1);

/* ---------- stack flow ---------- */
$("#stackPlay")?.addEventListener("click", () => {
  const nodes = $$("#stackFlow .llm-stack-node");
  nodes.forEach((n) => n.classList.remove("active"));
  let i = 0;
  const tick = () => {
    nodes.forEach((n, idx) => n.classList.toggle("active", idx === i));
    i += 1;
    if (i < nodes.length) setTimeout(tick, 450);
    else setTimeout(() => nodes.forEach((n) => n.classList.add("active")), 400);
  };
  tick();
});

/* ---------- chain click highlight ---------- */
$$("#llmChain .llm-chain-step").forEach((el) => {
  el.style.cursor = "pointer";
  el.addEventListener("click", () => highlightChain(Number(el.dataset.step)));
});
