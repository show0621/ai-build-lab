/* SPEC / PROMPT Workshop — generate Claude-ready specs
 * Demo: 4 primary function tabs (one view at a time) + workbench layout. */

const DEMO_BLOCKS = [
  {
    title: "區塊0｜殼層與主導覽（四功能分明，禁止擠在同一頁）",
    body: `【資訊架構鐵律 — 第 1 回合就做對】
主畫面必須有「四個一級功能」，用頂部 Tab（或等同主導覽）切換；
**同一時間只顯示其中一個功能的完整介面**，切換時整塊內容區替換，不要四種功能控制項同時攤開。

四個一級功能（標籤文字固定）：
1. 【知識問答】— 知識拓撲 + 節點詳情 + AI 問答（三欄工作台）
2. 【專業翻譯】— 原文／譯文對照 + 單字教學（獨立全頁）
3. 【去識別化】— 原文／去識別預覽 + 對照表（獨立全頁）
4. 【筆記本】— 筆記列表 + 編輯預覽（獨立全頁）

次要功能不要塞進主畫面：
- 「上傳知識庫」→ 頂欄按鈕開模態
- 「設定／參數」→ 齒輪圖示進設定頁或抽屜

■ 殼層版型
- 全螢幕 App：固定頂欄 +（頂欄下方或頂欄內）四功能 Tab + 下方內容區佔滿剩餘高度
- html/body/#app：height: 100vh（或 100dvh）；overflow: hidden
- 只有內容區內部可捲動；禁止整頁無限往下堆、禁止一打開就看到四種功能同時出現

■ 頂欄（深色 slate ≈ #1e293b，白字）
- 左：圖示 + 產品名 + 短副標
- 中或下：四功能 Tab（作用中 Tab 有清楚底色／底線；未選中淡色）
- 右：模型下拉、AI 狀態、知識庫狀態、上傳按鈕（藍實心）、設定（次要）

■ 視覺
- 底 #f3f4f6；內容區白／玻璃面板、圓角、輕陰影、細邊框
- 藍＝知識導覽；綠＝問答；琥珀＝翻譯；去識別化可用靛／灰；危險＝紅
- 禁止紫系 AI 套版、禁止 wireframe、禁止把所有面板疊在同一視窗

■ 第 1 回合驗收（必須能點）
- 點四個 Tab，各自出現完全不同的完整工作區（不是同一頁捲下去的四段）
- 預設開在【知識問答】`,
  },
  {
    title: "區塊1｜知識問答（三欄工作台 — 僅此 Tab 顯示）",
    body: `僅在主導覽選【知識問答】時顯示。這是預設首屏。

■ 版面（此 Tab 專用）
左｜右上｜右下 三區；可拖曳分隔條；左欄可收合。

■ 左欄｜知識拓撲
- 標題「知識拓撲」＋縮放 −／＋、重置、返回總覽
- 【圖案】／【大綱】切換；麵包屑；搜尋
- 點節點 → 右上載入內容
- 外觀：白面板、藍系標題、淺網格＋卡片節點（圖案模式）

■ 右上｜知識節點解析
- 標題、類型徽章、長文可捲動（法規層級清楚）
- 工具：字級 A−～A+、匯出 PDF；英文旁「翻譯」→ 黃色可拖曳浮窗
- 空狀態：置中「請點左側節點查看內容」

■ 右下｜AI 內部問答
- 【內部問答】／【匯入筆記】切換
- 對話泡泡（AI 淡綠底）、多行輸入、「提問」主鈕
- 回答固定四段：【推論思考】【正式回答】【查核實務重點】【參考依據】
- 引用 [知識庫 N]；無依據不得臆測
- 操作列：存筆記本、存入知識庫、匯出 Word／ODT／PDF
  （「存筆記本」後可提示切到【筆記本】Tab）

■ RAG 建議參數（寫進設定，可調）
Chunk 1500、Overlap 100、Top-K 20、Reranker 開、Rerank 後 6、
Temperature 0.15、Context 32K、Max Output 一般 3K／複雜 9K

■ 此 Tab 禁止
- 不要在此頁再塞翻譯對照全頁、去識別化對照表、筆記本列表`,
  },
  {
    title: "區塊2｜專業翻譯（獨立全頁 — 僅此 Tab 顯示）",
    body: `僅在主導覽選【專業翻譯】時顯示。整頁專做翻譯，不要縮成右下小模式。

■ 版面
- 頂列：語向下拉（中→英、英→中、中→日、日→中）＋「開始翻譯」主鈕
- 主區雙欄：左原文｜右譯文（可貼上、可編輯校正）；可切「並排／分段對照」
- 右側或可收合抽屜：「單字教學」（生字、例句、收藏；點字高亮）
- 底列：存筆記本、存知識庫、匯出 Word／ODT／PDF（商業化排版）

■ 行為
- 術語優先知識庫詞彙；校正可回寫；空／載入／失敗有狀態
- 外觀：玻璃面板；琥珀／黃點綴；段落間距清楚、不擠

■ 此 Tab 禁止出現拓撲樹、問答泡泡、去識別對照表`,
  },
  {
    title: "區塊3｜去識別化（獨立全頁 — 僅此 Tab 顯示）",
    body: `僅在主導覽選【去識別化】時顯示。必須是完整工作頁，不是聊天裡一顆小按鈕。

■ 版面
- 頂列：貼上／上傳、「一鍵去識別化」主鈕、匯出 Word／ODT／PDF
- 主區雙欄即時預覽：左原文｜右去識別化後（隨對照表變更即時更新）
- 下方或側邊「對照表」：原文實體｜代號｜類型｜套用勾選；可新增／刪除列
- 改勾選或增刪 → 右側預覽動態同步

■ 規則
- 自動抓「公司」＋數字／代號等；可擴充人名／信箱／電話
- 代號：甲乙丙丁… 用盡後 A B C D…；同實體全文一致
- 匯出提示對照表敏感；可選「只匯出文本不含對照表」

■ 此 Tab 禁止出現拓撲、翻譯對照、筆記本列表`,
  },
  {
    title: "區塊4｜筆記本（獨立全頁 — 僅此 Tab 顯示）",
    body: `僅在主導覽選【筆記本】時顯示。

■ 版面
- 左：筆記列表（搜尋、時間、來源標籤：問答／翻譯／去識別化／手動）；選中態清楚
- 右：標題＋內文編輯／預覽、來源、時間
- 工具：新增、刪除、存檔、匯出 Word／ODT／PDF、回寫知識庫（需確認）
- 從問答「存筆記本」進來時帶入四段結構與引用

■ 空狀態：「尚無筆記，先到知識問答存一則」
■ 此 Tab 禁止塞其他三個功能的完整 UI`,
  },
  {
    title: "區塊5｜上傳入庫（模態，次要）",
    body: `由頂欄「上傳知識庫」打開模態，不要做成第五個主 Tab。

■ 模態內容
- 檔名；三種模式 radio：AI 自動分類｜掛到既有節點｜新建分類資料夾
- 選填關鍵字；可勾「AI 產摘要」
- 取消｜開始上傳；進度／成功 toast／失敗原因

■ 可另有檔案列表（設定或次選單）：檔名、類型、版本、時間、狀態、下載／刪除`,
  },
  {
    title: "區塊6｜設定／參數（次要頁）",
    body: `齒輪進入，不要塞進四個主 Tab。

分組表單：RAG 參數｜模型連線｜匯出樣板（浮水印）｜健康檢查（llm／vector／reranker）
數字欄顯示建議值；儲存成功 toast`,
  },
];

let wsBlocks = [];
let wsCache = { spec: "", prompt: "", system: "" };
let wsActiveTab = "spec";

function wsEl(id) {
  return document.getElementById(id);
}

function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderWsBlocks() {
  const root = wsEl("wsBlocks");
  if (!root) return;
  root.innerHTML = wsBlocks
    .map(
      (b, i) => `
    <article class="ws-block" data-i="${i}">
      <div class="ws-block-top">
        <input class="ws-block-title" data-i="${i}" value="${escapeHtml(b.title)}" placeholder="區塊標題" />
        <button type="button" class="ws-block-del" data-del="${i}" title="刪除區塊">刪除</button>
      </div>
      <textarea class="ws-block-body" data-i="${i}" rows="16" placeholder="這個區塊要有什麼功能、規則、參數、UI…">${escapeHtml(b.body)}</textarea>
    </article>`
    )
    .join("");
}

function readWsBlocksFromDom() {
  const titles = [...document.querySelectorAll(".ws-block-title")];
  const bodies = [...document.querySelectorAll(".ws-block-body")];
  wsBlocks = titles.map((t, i) => ({
    title: t.value.trim() || `區塊${i + 1}`,
    body: (bodies[i] && bodies[i].value.trim()) || "",
  }));
}

function loadDemoBlocks() {
  wsBlocks = DEMO_BLOCKS.map((b) => ({ ...b }));
  renderWsBlocks();
}

function buildSystemChecklist() {
  return `## 整套系統必做清單

### A. 第一優先：四功能分明的可操作 UI
- 頂部（或等同）一級導覽：**知識問答｜專業翻譯｜去識別化｜筆記本**
- **一次只顯示一個功能的完整畫面**；禁止四種功能擠在同一頁同時攤開
- 【知識問答】才是三欄（左拓撲／右上詳情／右下問答）
- 另外三個各有獨立全頁工作區
- 禁止只交目錄樹、空殼、未設計頁

### B. 知識庫
- 入庫、metadata、版本、引用回原文

### C. Markdown／切塊與 RAG 參數
- Chunk／Overlap／Top-K／Reranker／Temperature／Max Output 可配置

### D. 上傳下載與匯出
- 上傳用模態；Word／ODT／PDF 匯出

### E. 安全與驗收
- 對照表敏感提示；四 Tab 都能點通；失敗狀態 UX
`;
}

function buildUiSpec() {
  return `## UI／網頁呈現規格（必做）

### 資訊架構（防亂版鐵律）
1. 固定頂欄 + **四個一級 Tab**：知識問答｜專業翻譯｜去識別化｜筆記本
2. 內容區依 Tab **整塊切換**（顯示／隱藏或路由），一次只渲染一個功能
3. **禁止**：把拓撲、翻譯對照、去識別表、筆記列表同時塞進同一個 index 畫面
4. 殼層 \`100vh\` + \`overflow:hidden\`；捲動只發生在各面板內部

### 各 Tab 畫面
| Tab | 畫面 |
|---|---|
| 知識問答 | 左拓撲 + 右上詳情 + 右下問答（可拖曳分隔） |
| 專業翻譯 | 語向＋原文／譯文對照＋單字教學＋匯出 |
| 去識別化 | 原文／結果雙欄＋對照表即時同步＋匯出 |
| 筆記本 | 左列表＋右編輯／預覽＋匯出 |

### 視覺與互動
- 底 #f3f4f6；深頂欄；玻璃白面板；藍／綠／琥珀語意色；勿紫系套版
- Tab 作用中狀態清楚；空狀態／loading／錯誤提示
- 上傳＝模態；設定＝次要入口

### 第 1 回合驗收
- 打開即見四 Tab；預設在知識問答且三欄可點
- 點另外三個 Tab，各見獨立完整介面（不是同一頁往下捲）
- 禁止只交結構檔／README／無設計頁
`;
}

function buildSpec() {
  const name = wsEl("wsProjectName")?.value.trim() || "未命名專案";
  const goal = wsEl("wsGoal")?.value.trim() || "";
  const users = wsEl("wsUsers")?.value.trim() || "";
  const stack = wsEl("wsStack")?.value.trim() || "";

  const blocksMd = wsBlocks
    .map((b, i) => `### ${b.title || `區塊 ${i + 1}`}\n\n${b.body || "（尚未填寫）"}\n`)
    .join("\n");

  return `# SPEC：${name}

## 0. 文件說明
- 目標：專業知識庫工作台；**四種功能各自成頁、用 Tab 切換**，介面清楚不雜亂
- 必須同時有：(1) 可操作 UI (2) 知識庫／參數／匯出能力

## 1. 背景與目標
${goal}

## 2. 使用者與場景
- 主要使用者：${users}
- 場景：查法規問答／翻譯／去識別化／存筆記／匯出

## 3. 驗收標準
- 頂部可見四個一級功能 Tab，點哪個只顯示哪個
- 【知識問答】：左點節點→右上內容；右下四段回答＋引用
- 【專業翻譯】【去識別化】【筆記本】各為獨立完整工作頁
- 上傳模態、參數可配置；畫面不亂、不四功能同屏堆疊

${buildUiSpec()}

## 4. 功能區塊明細

${blocksMd}

## 5. 技術偏好
${stack}

## 6. 非功能
- 繁中；內部工具安全；參數不寫死

## 7. 排除
- 不取代正式法律意見；不可無依據臆測
- 不交只有結構沒有介面；不交四功能擠同一頁的亂版

## 8. 交付物
1. 可打開的漂亮工作台（第 1 優先）
2. README
3. 示範資料＋匯出樣張
4. 實作對照清單

${buildSystemChecklist()}

## 9. 實作順序（強制）
1. **第 1 回合**：殼層＋四 Tab 切換＋四個畫面的完整 UI（可用 mock）
2. 第 2 回合：知識問答接真 RAG＋引用
3. 第 3 回合：去識別化即時同步＋匯出
4. 第 4 回合：翻譯、筆記本串接、上傳模態、設定頁
`;
}

function buildPrompt() {
  const name = wsEl("wsProjectName")?.value.trim() || "未命名專案";
  const goal = wsEl("wsGoal")?.value.trim() || "";
  const users = wsEl("wsUsers")?.value.trim() || "";
  const stack = wsEl("wsStack")?.value.trim() || "";

  const blockList = wsBlocks.map((b) => `【${b.title}】\n${b.body}`).join("\n\n");

  return `你是資深全端工程師 + 產品級 UI 設計師。
請做一個專業單頁「知識庫工作台」。**介面必須清楚：四種功能用四個 Tab 分開，一次只顯示一個，禁止全部擠在 index 同一畫面。**

# 專案：${name}

## 目標
${goal}

## 使用者
${users}

## 技術
${stack}

---

## ⚠ 第 1 回合必做（可用 mock）— 先把「不亂」做對

### 殼層
- 固定深色頂欄 + **四個一級 Tab**（文字固定）：
  1. 知識問答
  2. 專業翻譯
  3. 去識別化
  4. 筆記本
- 下方內容區依 Tab **整塊切換**（顯示/隱藏）。預設開「知識問答」
- \`100vh\` + 殼層 \`overflow:hidden\`；只在面板內捲動
- **禁止**：四種功能的面板同時出現在同一頁；禁止只交資料夾／README

### Tab「知識問答」= 三欄工作台
- 左：知識拓撲（圖案／大綱、搜尋、點節點）
- 右上：節點詳情（長文、字級、黃浮窗翻譯鈕）
- 右下：AI 問答（四段回答＋引用＋存筆記本／匯出）

### Tab「專業翻譯」= 獨立全頁
- 語向＋原文｜譯文對照＋單字教學＋匯出（不要縮在右下角）

### Tab「去識別化」= 獨立全頁
- 原文｜結果雙欄＋對照表即時更新＋匯出

### Tab「筆記本」= 獨立全頁
- 左列表｜右編輯；可從問答存入

視覺：底 #f3f4f6、玻璃白面板、藍／綠／琥珀、圓角輕陰影；勿紫系套版。
上傳用頂欄模態；設定用齒輪（次要）。

---

## 功能明細

${blockList}

---

## 實作規則
- 第 1 回合直接交可打開的 HTML/CSS/JS（或同等前端），**四 Tab 都能點出不同完整畫面**
- 之後再接真 RAG／匯出；法令不得臆測；去識別化甲乙丙丁→ABCD 即時同步
- 回覆寫清：怎麼打開、如何點四個 Tab 驗收

## 開始前
用 ≤5 點複述，必須包含：「會做四個一級 Tab、一次只顯示一個功能畫面，不會把四種功能擠在同一頁」。
然後立刻做第 1 回合。`;
}

function refreshWsOutput() {
  const out = wsEl("wsOutput");
  if (!out) return;
  const text = wsCache[wsActiveTab] || "尚未產生。請先按「產生給 Claude 的 SPEC＋PROMPT」。";
  out.textContent = text;
}

function generateWs() {
  readWsBlocksFromDom();
  if (!wsBlocks.length) loadDemoBlocks();
  wsCache.spec = buildSpec();
  wsCache.prompt = buildPrompt();
  wsCache.system = buildSystemChecklist();
  refreshWsOutput();
  const status = wsEl("wsCopyStatus");
  if (status) {
    status.hidden = false;
    status.textContent = "已產生 ✓";
    setTimeout(() => {
      status.hidden = true;
    }, 1600);
  }
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (_) {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
}

function initSpecWorkshop() {
  if (!wsEl("workshop")) return;

  loadDemoBlocks();

  wsEl("wsLoadDemo")?.addEventListener("click", () => loadDemoBlocks());

  wsEl("wsAddBlock")?.addEventListener("click", () => {
    readWsBlocksFromDom();
    wsBlocks.push({
      title: `區塊${wsBlocks.length + 1}｜新功能`,
      body: "請描述：屬於哪個 Tab／獨立頁還是模態、版面、按鈕、流程、規則、與其他功能如何切換。",
    });
    renderWsBlocks();
  });

  wsEl("wsBlocks")?.addEventListener("click", (e) => {
    const del = e.target.closest("[data-del]");
    if (!del) return;
    readWsBlocksFromDom();
    const i = Number(del.getAttribute("data-del"));
    wsBlocks.splice(i, 1);
    renderWsBlocks();
  });

  wsEl("wsGenerate")?.addEventListener("click", generateWs);

  document.querySelectorAll("[data-ws-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      wsActiveTab = btn.getAttribute("data-ws-tab");
      document.querySelectorAll("[data-ws-tab]").forEach((b) => {
        const on = b === btn;
        b.classList.toggle("active", on);
        b.setAttribute("aria-selected", String(on));
      });
      refreshWsOutput();
    });
  });

  wsEl("wsCopy")?.addEventListener("click", async () => {
    const ok = await copyText(wsCache[wsActiveTab] || wsEl("wsOutput")?.textContent || "");
    const status = wsEl("wsCopyStatus");
    if (status) {
      status.hidden = false;
      status.textContent = ok ? "已複製目前分頁" : "複製失敗";
      setTimeout(() => {
        status.hidden = true;
      }, 1600);
    }
  });

  wsEl("wsCopyAll")?.addEventListener("click", async () => {
    const all = `===== SPEC =====\n\n${wsCache.spec}\n\n===== PROMPT =====\n\n${wsCache.prompt}\n\n===== 整套系統清單 =====\n\n${wsCache.system}`;
    const ok = await copyText(all);
    const status = wsEl("wsCopyStatus");
    if (status) {
      status.hidden = false;
      status.textContent = ok ? "已複製全部" : "複製失敗";
      setTimeout(() => {
        status.hidden = true;
      }, 1600);
    }
  });

  generateWs();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSpecWorkshop);
} else {
  initSpecWorkshop();
}
