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
let pipeExtraTimers = [];
let pipePaused = false;
let pipeStep = 0;

function setPipeStatus(t) {
  const el = $("#pipeStatus");
  if (el) el.textContent = t;
}

/** Journey beat times (seconds) — keep in sync with drawAttnSvg CSS delays */
const JOURNEY = {
  word: 0,
  prob: 2.2,
  dash: 4.1,
  hot: 6.9,
  next: 8.8,
  done: 11.2,
};

function buildCloudData(focusTok) {
  // z: 0 near (big/sharp) → 1 far (small/soft). Unrelated can also be large when near.
  const cloud = [
    { t: "受測個體", rel: 0.94, x: 0.18, y: 0.32, s: 34, z: 0.12, c: "#0f766e" },
    { t: "台積電", rel: 0.04, x: 0.34, y: 0.22, s: 28, z: 0.2, c: "#6b7280" },
    { t: "功能", rel: 0.9, x: 0.72, y: 0.28, s: 30, z: 0.15, c: "#0369a1" },
    { t: "ETF", rel: 0.04, x: 0.52, y: 0.18, s: 26, z: 0.25, c: "#78716c" },
    { t: "風險", rel: 0.84, x: 0.86, y: 0.48, s: 24, z: 0.35, c: "#c2410c" },
    { t: "鴻海", rel: 0.04, x: 0.12, y: 0.16, s: 11, z: 0.82, c: "#9ca3af" },
    { t: "移轉訂價", rel: 0.88, x: 0.42, y: 0.38, s: 28, z: 0.18, c: "#15803d" },
    { t: "美食", rel: 0.02, x: 0.28, y: 0.58, s: 20, z: 0.4, c: "#78716c" },
    { t: "單純", rel: 0.78, x: 0.58, y: 0.62, s: 22, z: 0.3, c: "#a16207" },
    { t: "旅遊", rel: 0.02, x: 0.78, y: 0.16, s: 10, z: 0.88, c: "#a8a29e" },
    { t: "選擇", rel: 0.86, x: 0.64, y: 0.42, s: 27, z: 0.22, c: "#1e3a5f" },
    { t: "疫苗", rel: 0.03, x: 0.22, y: 0.78, s: 9, z: 0.9, c: "#a8a29e" },
    { t: "TNMM", rel: 0.66, x: 0.14, y: 0.55, s: 18, z: 0.45, c: "#0284c7" },
    { t: "高股息", rel: 0.04, x: 0.48, y: 0.78, s: 24, z: 0.28, c: "#6b7280" },
    { t: "可比公司", rel: 0.62, x: 0.88, y: 0.24, s: 16, z: 0.5, c: "#be123c" },
    { t: "永續", rel: 0.05, x: 0.36, y: 0.48, s: 12, z: 0.7, c: "#9ca3af" },
    { t: "利潤率", rel: 0.55, x: 0.76, y: 0.68, s: 17, z: 0.42, c: "#0d9488" },
    { t: "籃球", rel: 0.02, x: 0.08, y: 0.72, s: 8, z: 0.92, c: "#a8a29e" },
    { t: "OECD", rel: 0.5, x: 0.3, y: 0.14, s: 15, z: 0.55, c: "#1d4ed8" },
    { t: "天氣", rel: 0.01, x: 0.92, y: 0.72, s: 7, z: 0.95, c: "#d4d4d8" },
    { t: "一方", rel: 0.58, x: 0.2, y: 0.68, s: 16, z: 0.48, c: "#b45309" },
    { t: "指數", rel: 0.05, x: 0.56, y: 0.32, s: 22, z: 0.32, c: "#6b7280" },
    { t: "資產", rel: 0.45, x: 0.9, y: 0.56, s: 14, z: 0.58, c: "#475569" },
    { t: "咖啡", rel: 0.01, x: 0.44, y: 0.66, s: 10, z: 0.78, c: "#a8a29e" },
    { t: "查核準則", rel: 0.42, x: 0.5, y: 0.1, s: 14, z: 0.6, c: "#0e7490" },
    { t: "半導體", rel: 0.04, x: 0.68, y: 0.78, s: 30, z: 0.16, c: "#57534e" },
    { t: "函釋", rel: 0.4, x: 0.38, y: 0.7, s: 14, z: 0.52, c: "#7c3aed" },
    { t: "Podcast", rel: 0.02, x: 0.82, y: 0.38, s: 9, z: 0.85, c: "#a8a29e" },
    { t: "BAPA", rel: 0.38, x: 0.46, y: 0.86, s: 13, z: 0.62, c: "#0369a1" },
    { t: "國泰", rel: 0.03, x: 0.1, y: 0.42, s: 11, z: 0.75, c: "#9ca3af" },
    { t: "個體", rel: 0.72, x: 0.54, y: 0.5, s: 20, z: 0.25, c: "#0f766e" },
    { t: "設計", rel: 0.03, x: 0.7, y: 0.54, s: 18, z: 0.38, c: "#78716c" },
    { t: "交易", rel: 0.44, x: 0.26, y: 0.4, s: 14, z: 0.55, c: "#57534e" },
    { t: "富邦", rel: 0.03, x: 0.6, y: 0.86, s: 10, z: 0.8, c: "#a8a29e" },
    { t: "利潤", rel: 0.4, x: 0.16, y: 0.86, s: 13, z: 0.65, c: "#15803d" },
    { t: "較", rel: 0.22, x: 0.66, y: 0.2, s: 16, z: 0.4, c: "#334155", isNext: true },
    { t: "零碳", rel: 0.05, x: 0.84, y: 0.84, s: 8, z: 0.9, c: "#a8a29e" },
    { t: "貼文", rel: 0.02, x: 0.4, y: 0.28, s: 9, z: 0.84, c: "#a8a29e" },
    { t: "公司治理", rel: 0.06, x: 0.94, y: 0.36, s: 10, z: 0.72, c: "#9ca3af" },
    { t: "定期定額", rel: 0.03, x: 0.32, y: 0.88, s: 8, z: 0.88, c: "#a8a29e" },
    { t: "Usability", rel: 0.02, x: 0.74, y: 0.46, s: 7, z: 0.93, c: "#d4d4d8" },
    { t: "RSS", rel: 0.02, x: 0.48, y: 0.42, s: 8, z: 0.86, c: "#a8a29e" },
    { t: "AJAX", rel: 0.02, x: 0.08, y: 0.28, s: 9, z: 0.8, c: "#a8a29e" },
    { t: "簡報", rel: 0.02, x: 0.58, y: 0.74, s: 21, z: 0.34, c: "#6b7280" },
    { t: "股市", rel: 0.03, x: 0.8, y: 0.58, s: 25, z: 0.22, c: "#57534e" },
    { t: "房價", rel: 0.02, x: 0.24, y: 0.24, s: 12, z: 0.68, c: "#9ca3af" },
    { t: "Participation", rel: 0.02, x: 0.92, y: 0.64, s: 7, z: 0.94, c: "#d4d4d8" },
    { t: "區塊鏈", rel: 0.03, x: 0.15, y: 0.48, s: 23, z: 0.3, c: "#64748b" },
    { t: "元宇宙", rel: 0.02, x: 0.88, y: 0.14, s: 19, z: 0.36, c: "#78716c" },
  ];

  cloud.forEach((w) => {
    if (w.t === focusTok || w.t.includes(focusTok)) {
      w.rel = Math.max(w.rel, 0.95);
      w.isFocus = true;
      w.z = Math.min(w.z ?? 0.2, 0.15);
      w.s = Math.max(w.s, 32);
      w.c = "#0f172a";
    }
    if (w.z == null) w.z = 0.5;
  });
  if (!cloud.some((w) => w.isFocus)) {
    cloud.push({ t: focusTok, rel: 0.98, x: 0.5, y: 0.45, s: 32, z: 0.1, c: "#0f172a", isFocus: true });
  }
  return cloud;
}

function drawAttnSvg(focusIdx, mode = "journey") {
  const svg = $("#attnSvg");
  if (!svg) return;
  // mode: journey = one continuous nebula→synapse→prob play (CSS delays)
  //        predict = final still (also used after journey)
  const tokens = PIPE_TOKENS;
  const W = 860;
  const H = 480;
  const focus = Math.min(Math.max(focusIdx, 0), tokens.length - 1);
  const focusTok = tokens[focus];
  const cloud = buildCloudData(focusTok);
  const isJourney = mode === "journey" || mode === "awaken" || mode === "cloud" || mode === "vector" || mode === "prob" || mode === "link";

  const nextSpots = [
    { t: "功能", p: 0.35, c: "#0369a1" },
    { t: "較", p: 0.18, c: "#0d9488" },
    { t: "單純", p: 0.14, c: "#a16207" },
    { t: "風險", p: 0.1, c: "#c2410c" },
    { t: "一方", p: 0.08, c: "#b45309" },
  ];

  const related = [...cloud].filter((w) => w.rel >= 0.35).sort((a, b) => b.rel - a.rel);
  const focusNode = cloud.find((w) => w.isFocus) || related[0];
  const fx = focusNode.x * W;
  const fy = focusNode.y * H;

  // Sync probs → then even dash web → high-P green → next accent (no late % wave)
  const T_WORD = JOURNEY.word;
  const T_PROB = JOURNEY.prob;
  const T_DASH = JOURNEY.dash;
  const T_HOT = JOURNEY.hot;
  const T_NEXT = JOURNEY.next;
  const JOURNEY_MS = Math.round(JOURNEY.done * 1000);

  const defs = `<defs>
    <radialGradient id="queryHalo" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="rgba(15,23,42,0.18)"/>
      <stop offset="55%" stop-color="rgba(71,85,105,0.06)"/>
      <stop offset="100%" stop-color="rgba(15,23,42,0)"/>
    </radialGradient>
    <radialGradient id="nebulaMist" cx="48%" cy="46%" r="55%">
      <stop offset="0%" stop-color="rgba(100,116,139,0.1)"/>
      <stop offset="45%" stop-color="rgba(148,163,184,0.05)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
    </radialGradient>
    <filter id="neuralGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="2.2" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="farSoft" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="1.1"/>
    </filter>
  </defs>
  <rect width="${W}" height="${H}" fill="#ffffff"/>
  <ellipse cx="${W * 0.48}" cy="${H * 0.46}" rx="${W * 0.42}" ry="${H * 0.38}" fill="url(#nebulaMist)"/>
  <ellipse cx="${W * 0.28}" cy="${H * 0.3}" rx="120" ry="70" fill="rgba(148,163,184,0.06)"/>
  <ellipse cx="${W * 0.72}" cy="${H * 0.62}" rx="140" ry="80" fill="rgba(100,116,139,0.05)"/>`;

  let ambient = "";
  for (let i = 0; i < 36; i++) {
    const ax = 30 + ((i * 89) % (W - 60));
    const ay = 40 + ((i * 67) % (H - 70));
    const zr = (i % 5) / 5;
    const r = zr < 0.35 ? 2.2 : zr < 0.7 ? 1.4 : 0.8;
    const op = 0.06 + (1 - zr) * 0.12;
    ambient += `<circle class="attn-float attn-nebula-dot" cx="${ax}" cy="${ay}" r="${r}" fill="rgba(71,85,105,${op})" style="--d:${5 + (i % 6)}s;--delay:${T_WORD + (i % 14) * 0.07}s"/>`;
  }

  // Soft search rings
  let vectorFx = `<g class="attn-phase-vec" style="--delay:${T_PROB}s">
    <circle class="attn-vec-ring" cx="${fx}" cy="${fy}" r="34" fill="url(#queryHalo)"/>
    <circle class="attn-vec-ring r2" cx="${fx}" cy="${fy}" r="62" fill="none" stroke="rgba(30,41,59,0.45)" stroke-width="1.3"/>
    <circle class="attn-vec-ring r3" cx="${fx}" cy="${fy}" r="102" fill="none" stroke="rgba(71,85,105,0.28)" stroke-width="1.1"/>
    <circle class="attn-vec-ring r4" cx="${fx}" cy="${fy}" r="140" fill="none" stroke="rgba(100,116,139,0.16)" stroke-width="0.9"/>
    <circle cx="${fx}" cy="${fy}" r="4.5" fill="#1e293b" filter="url(#neuralGlow)"/>
  </g>`;

  // Nodes that get probs + links (even web around focus)
  const linkNodes = related.filter((w) => w !== focusNode).slice(0, 10);

  // ① All probability labels almost simultaneously
  let pills = "";
  linkNodes.forEach((b, i) => {
    const px = b.x * W;
    const py = b.y * H - 22;
    pills += `<g class="attn-prob-reveal" style="--delay:${T_PROB + 0.2 + i * 0.045}s">
      <rect x="${px - 22}" y="${py - 10}" width="44" height="18" rx="4" fill="#ffffff" stroke="${b.c}" stroke-width="1.4"/>
      <text class="attn-prob-count" x="${px}" y="${py}" text-anchor="middle" dominant-baseline="middle" font-size="11" font-family="JetBrains Mono,monospace" fill="${b.c}" font-weight="700">${Math.round(b.rel * 100)}%</text>
    </g>`;
  });

  // Balanced edges: hub spokes to every labeled node + angular ring for even structure
  const edges = [];
  linkNodes.forEach((b) => {
    edges.push({ a: focusNode, b, p: b.rel, kind: "hub" });
  });
  const byAngle = [...linkNodes]
    .map((n) => ({ n, ang: Math.atan2(n.y - focusNode.y, n.x - focusNode.x) }))
    .sort((a, b) => a.ang - b.ang);
  for (let i = 0; i < byAngle.length; i++) {
    const a = byAngle[i].n;
    const b = byAngle[(i + 1) % byAngle.length].n;
    edges.push({ a, b, p: Math.min(a.rel, b.rel) * 0.9, kind: "ring" });
  }

  // ② Dashes bloom together (tiny angular stagger) · ③ high-P thicken green together
  let links = "";
  let pulses = "";
  edges.forEach((e, i) => {
    const x1 = e.a.x * W;
    const y1 = e.a.y * H;
    const x2 = e.b.x * W;
    const y2 = e.b.y * H;
    const mx = (x1 + x2) / 2 + (i % 2 === 0 ? 14 : -14);
    const my = (y1 + y2) / 2;
    const d = `M${x1} ${y1} Q${mx} ${my} ${x2} ${y2}`;
    const dashDelay = `${T_DASH + (i % 10) * 0.05}s`;
    links += `<path class="attn-dash" d="${d}" fill="none" style="--delay:${dashDelay};--op:${e.kind === "hub" ? 0.7 : 0.45}"/>`;
    if (e.kind === "hub" && e.p >= 0.55) {
      const hotDelay = `${T_HOT + (i % 8) * 0.06}s`;
      links += `<path class="attn-dash-hot" d="${d}" fill="none" style="--delay:${hotDelay};--w:${1.8 + e.p * 1.2}"/>`;
      pulses += `<path class="attn-ink-pulse attn-hot-pulse" d="${d}" fill="none" style="--delay:${hotDelay}"/>`;
    }
  });

  // Draw far → near for 3D stacking
  const byDepth = [...cloud].sort((a, b) => (b.z ?? 0.5) - (a.z ?? 0.5));
  const linkedSet = new Set(linkNodes.map((w) => w.t));
  let words = "";
  byDepth.forEach((w, i) => {
    const x = w.x * W;
    const y = w.y * H;
    const z = w.z ?? 0.5;
    const depthScale = 0.55 + (1 - z) * 0.7;
    const fontSize = Math.max(7, Math.round(w.s * depthScale));
    const depthOp = (0.28 + (1 - z) * 0.72).toFixed(2);
    const isRel = w.rel >= 0.35;
    const nextHit = nextSpots.find((n) => n.t === w.t);
    let zCls = z < 0.33 ? "z-near" : z < 0.66 ? "z-mid" : "z-far";
    let cls = `attn-cloud-word attn-float is-awaken ${zCls}`;
    if (w.isFocus) cls += " is-focus";
    if (isRel) cls += " is-related";
    if (linkedSet.has(w.t) || w.isFocus) cls += " is-linked";
    if (!isRel && !w.isFocus) cls += " is-gray-rest";
    if (nextHit) cls += " is-next";

    let fill = w.c;
    if (nextHit) fill = nextHit.c;

    const awaken = `${T_WORD + (i % 20) * 0.09}s`;
    const grayDelay = `${T_HOT}s`;
    const floatDur = `${4.5 + z * 3.5}s`;
    const filterAttr = z > 0.7 ? ' filter="url(#farSoft)"' : "";
    words += `<text class="${cls}" x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle"
      font-size="${fontSize}" font-family="Georgia,'Noto Serif TC',serif" font-weight="${w.isFocus || (isRel && z < 0.4) ? 700 : 500}"
      fill="${fill}"${filterAttr}
      style="--d:${floatDur};--delay:${(i % 9) * 0.07}s;--i:${i};--awaken:${awaken};--gray:${grayDelay};--depth-op:${depthOp}">${w.t}</text>`;
  });

  // Next-step accent only (no second wave of % pills — avoids “late probs”)
  let predict = nextSpots
    .map((s, i) => {
      const node = cloud.find((w) => w.t === s.t);
      if (!node) return "";
      const x = node.x * W;
      const y = node.y * H + 20;
      return `<g class="attn-next-tag" style="--delay:${T_NEXT + i * 0.08}s">
        <rect x="${x - 22}" y="${y - 9}" width="44" height="16" rx="3" fill="#0f172a" stroke="none"/>
        <text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-size="9" font-family="Outfit,sans-serif" fill="#f8fafc" font-weight="600">下一步</text>
      </g>`;
    })
    .join("");

  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.classList.remove("llm-attn-tech");
  svg.classList.add("llm-attn-literary", "attn-spread", "attn-white");
  svg.dataset.phase = isJourney ? "journey" : mode;
  svg.dataset.journeyMs = String(JOURNEY_MS);
  // Force restart CSS animations
  svg.innerHTML = "";
  void svg.offsetWidth;
  svg.innerHTML = defs + ambient + vectorFx + links + pulses + words + pills + predict;
}

function clearPipeTimer() {
  if (pipeTimer) {
    clearTimeout(pipeTimer);
    pipeTimer = null;
  }
  pipeExtraTimers.forEach(clearTimeout);
  pipeExtraTimers = [];
}

function schedule(fn, ms) {
  // Only replace the main chain timer — keep narration beats alive
  if (pipeTimer) {
    clearTimeout(pipeTimer);
    pipeTimer = null;
  }
  pipeTimer = setTimeout(() => {
    if (pipePaused) return;
    fn();
  }, ms);
}

/** Fire narration without cancelling the main schedule timer */
function afterMs(ms, fn) {
  const id = setTimeout(() => {
    if (pipePaused) return;
    fn();
  }, ms);
  pipeExtraTimers.push(id);
}

function narrateJourneyBeats() {
  afterMs(Math.round(JOURNEY.word * 1000 + 150), () =>
    setPipeStatus("文字星雲展開 · Embedding 向量空間")
  );
  afterMs(Math.round(JOURNEY.prob * 1000), () =>
    setPipeStatus("搜尋可能關鍵 Token · 同步標示條件機率…")
  );
  afterMs(Math.round(JOURNEY.dash * 1000), () =>
    setPipeStatus("神經虛線連結 · Attention 候選路徑成形…")
  );
  afterMs(Math.round(JOURNEY.hot * 1000), () =>
    setPipeStatus("Transformer 加權演算 · 高機率路徑強化…")
  );
  afterMs(Math.round(JOURNEY.next * 1000), () =>
    setPipeStatus("推演下一個可能 Token · Softmax 選字…")
  );
}

function runAttnSearchAnimation(focusIdx, onDone) {
  setPipeStatus("進入向量資料庫…");
  drawAttnSvg(focusIdx, "journey");
  narrateJourneyBeats();
  const ms = Number($("#attnSvg")?.dataset.journeyMs) || Math.round(JOURNEY.done * 1000);
  schedule(() => {
    if (pipePaused) return;
    if (onDone) onDone();
  }, ms);
}

function renderPipeTokens(active = -1) {
  const el = $("#pipeTokens");
  if (!el) return;
  el.innerHTML = PIPE_TOKENS.map(
    (t, i) => `<span class="llm-tok${i === active ? " on" : ""}">${t}</span>`
  ).join("");
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

/* ---- Cinematic: input → vector nebula (one shot) ---- */
const CINE_QUERY = "受測個體應如何選擇？";

function cineEls() {
  return {
    stage: $("#cineStage"),
    ui: $("#cineUi"),
    brain: $("#cineBrain"),
    type: $("#cineTypeText"),
    caret: $("#cineCaret"),
    flash: $("#cineFlash"),
    bubble: $("#cineUserBubble"),
  };
}

function cineFlashBurst() {
  const { flash } = cineEls();
  if (!flash) return;
  flash.classList.remove("on");
  void flash.offsetWidth;
  flash.classList.add("on");
}

function typeCineQuery(onDone) {
  const { type, caret, bubble, stage, ui, brain } = cineEls();
  if (!type) {
    if (onDone) onDone();
    return;
  }
  if (stage) stage.dataset.act = "ui";
  if (ui) ui.hidden = false;
  if (brain) brain.hidden = true;
  type.textContent = "";
  if (caret) caret.classList.add("blink");
  if (bubble) {
    bubble.classList.remove("is-focus");
    void bubble.offsetWidth;
    bubble.classList.add("is-focus");
  }
  setPipeStatus("輸入中…");
  let i = 0;
  const tick = () => {
    if (pipePaused) return;
    if (i < CINE_QUERY.length) {
      type.textContent = CINE_QUERY.slice(0, i + 1);
      const ch = CINE_QUERY[i];
      i += 1;
      let delay = 85 + Math.floor(Math.random() * 50);
      if (ch === "？") delay = 220;
      else if ("測體應何".includes(ch)) delay += 35;
      schedule(tick, delay);
      return;
    }
    setPipeStatus("等待…");
    if (caret) caret.classList.add("blink");
    schedule(() => {
      if (pipePaused) return;
      if (onDone) onDone();
    }, 1500);
  };
  tick();
}

function diveToBrain(onDone) {
  const { stage, ui, brain } = cineEls();
  setPipeStatus("進入向量資料庫…");
  if (stage) stage.dataset.act = "dive";
  cineFlashBurst();
  if (ui) ui.classList.add("cine-warp-out");
  schedule(() => {
    if (pipePaused) return;
    if (ui) {
      ui.hidden = true;
      ui.classList.remove("cine-warp-out");
    }
    if (brain) {
      brain.hidden = false;
      brain.classList.add("cine-warp-in");
    }
    if (stage) stage.dataset.act = "brain";
    drawAttnSvg(4, "journey");
    narrateJourneyBeats();
    const ms = Number($("#attnSvg")?.dataset.journeyMs) || Math.round(JOURNEY.done * 1000);
    schedule(() => {
      if (brain) brain.classList.remove("cine-warp-in");
      if (onDone) onDone();
    }, ms);
  }, 900);
}

function runCinematicJourney() {
  pipePaused = false;
  const out = $("#pipeOut");
  const bars = $("#probBars");
  const { stage, ui, brain, type, caret } = cineEls();

  if (type) type.textContent = "";
  if (caret) caret.classList.add("blink");
  if (ui) {
    ui.hidden = false;
    ui.classList.remove("cine-fade-out", "cine-warp-out");
  }
  if (brain) {
    brain.hidden = true;
    brain.classList.remove("cine-fade-in", "cine-warp-in");
  }
  if (stage) stage.dataset.act = "ui";
  if (out) out.textContent = "（尚未開始）";
  renderPipeTokens(-1);
  renderBars(
    bars,
    BASE_PROBS.map((x) => ({ ...x, p: 0.02 }))
  );

  typeCineQuery(() => {
    PIPE_TOKENS.forEach((_, i) => {
      setTimeout(() => {
        if (!pipePaused) renderPipeTokens(i);
      }, 90 * (i + 1));
    });
    diveToBrain(() => {
      if (pipePaused) return;
      highlightChain(4);
      renderBars(bars, BASE_PROBS, { pick: "功能" });
      if (out) out.textContent = "受測個體應如何選擇？功能";
      schedule(() => {
        if (pipePaused) return;
        setPipeStatus("生成下一 Token…");
        let built = "受測個體應如何選擇？功能";
        let i = 0;
        const tick = () => {
          if (pipePaused) return;
          if (i >= PIPE_GEN.length) {
            setPipeStatus("完成 · 下一個 Token 已推演（示意）");
            if (out) out.textContent = built + "…（示意）";
            renderBars(bars, NEXT_PROBS, { pick: "單純" });
            highlightChain(6);
            return;
          }
          built += PIPE_GEN[i];
          if (out) out.textContent = built;
          renderBars(
            bars,
            i === PIPE_GEN.length - 1
              ? NEXT_PROBS
              : [
                  { t: PIPE_GEN[i], p: 0.51 },
                  { t: "及", p: 0.17 },
                  { t: "與", p: 0.12 },
                  { t: "其他", p: 0.2 },
                ],
            { pick: PIPE_GEN[i], dimOthers: true }
          );
          i += 1;
          schedule(tick, 750);
        };
        tick();
      }, 500);
    });
  });
}

$("#pipePlay")?.addEventListener("click", () => {
  clearPipeTimer();
  runCinematicJourney();
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
  const svg = $("#attnSvg");
  if (svg) svg.innerHTML = "";
  renderBars(
    $("#probBars"),
    BASE_PROBS.map((x) => ({ ...x, p: 0 }))
  );
  if ($("#pipeOut")) $("#pipeOut").textContent = "（尚未開始）";
  setPipeStatus("就緒");
  $$("#llmChain .llm-chain-step").forEach((el) => el.classList.remove("active"));
  const { stage, ui, brain, type, caret, flash } = cineEls();
  if (type) type.textContent = "";
  if (caret) caret.classList.add("blink");
  if (flash) flash.classList.remove("on");
  if (ui) {
    ui.hidden = false;
    ui.classList.remove("cine-fade-out", "cine-warp-out");
  }
  if (brain) {
    brain.hidden = true;
    brain.classList.remove("cine-fade-in", "cine-warp-in");
  }
  if (stage) stage.dataset.act = "ui";
});

$("#llmPlayAll")?.addEventListener("click", () => {
  document.getElementById("pipeline")?.scrollIntoView({ behavior: "smooth" });
  setTimeout(() => {
    clearPipeTimer();
    runCinematicJourney();
  }, 400);
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
