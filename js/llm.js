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
const PIPE_GEN = ["功能", "較", "單純"];

let pipeTimer = null;
let pipePaused = false;
let pipeStep = 0;

function setPipeStatus(t) {
  const el = $("#pipeStatus");
  if (el) el.textContent = t;
}

function drawAttnSvg(focusIdx) {
  const svg = $("#attnSvg");
  if (!svg) return;
  const tokens = PIPE_TOKENS;
  const W = 640;
  const positions = tokens.map((_, i) => 50 + (i * (W - 100)) / Math.max(tokens.length - 1, 1));
  const focus = Math.min(focusIdx, tokens.length - 1);
  const weights = tokens.map((_, i) => {
    if (i === focus) return 0;
    const dist = Math.abs(i - focus);
    return Math.max(0.15, 1 - dist * 0.28);
  });

  let html = "";
  tokens.forEach((t, i) => {
    if (i === focus) return;
    const w = weights[i];
    html += `<path class="attn-line show" d="M${positions[focus]} 55 Q${(positions[focus] + positions[i]) / 2} 110 ${positions[i]} 155" stroke="#0d9f93" stroke-width="${1 + w * 5}" opacity="${0.2 + w * 0.7}" />`;
  });
  tokens.forEach((t, i) => {
    const on = i === focus;
    html += `<g>
      <rect x="${positions[i] - 28}" y="28" width="56" height="30" rx="8" fill="${on ? "#ecfdf5" : "#fff"}" stroke="${on ? "#0d9f93" : "#e2e8f0"}"/>
      <text x="${positions[i]}" y="48" text-anchor="middle" font-size="12" font-family="JetBrains Mono,monospace" fill="#0f172a">${t}</text>
      <circle cx="${positions[i]}" cy="155" r="${on ? 0 : 5 + weights[i] * 4}" fill="#0284c7" opacity="${on ? 0 : 0.3 + weights[i] * 0.6}"/>
    </g>`;
  });
  svg.innerHTML = html;
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
      setPipeStatus("2/6 Embedding → Transformer");
      highlightChain(2);
      drawAttnSvg(4);
      schedule(() => runStep(2), 900);
    },
    () => {
      setPipeStatus("3/6 Attention 加亮相關 Token");
      highlightChain(3);
      drawAttnSvg(4);
      $$("#pipeTokens .llm-tok").forEach((el, i) => {
        el.classList.toggle("on", i === 0 || i === 1 || i === 4);
      });
      schedule(() => runStep(3), 1100);
    },
    () => {
      setPipeStatus("4/6 計算下一個 Token 機率");
      highlightChain(4);
      renderBars(bars, BASE_PROBS);
      schedule(() => runStep(4), 1000);
    },
    () => {
      setPipeStatus("5/6 選出「功能」");
      highlightChain(5);
      renderBars(bars, BASE_PROBS, { pick: "功能", dimOthers: true });
      if (out) out.textContent = "受測個體應如何選擇？ → 功能";
      schedule(() => runStep(5), 1000);
    },
    () => {
      setPipeStatus("6/6 重複：再預測「較」「單純」…");
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
