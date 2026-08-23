/* SPEC / PROMPT Workshop — generate Claude-ready specs
 * Demo describes a professional 3-panel knowledge-workbench (layout/features
 * inspired by the author's live product, without naming it in outputs). */

const DEMO_BLOCKS = [
  {
    title: "區塊0｜整體版面與視覺",
    body: `請做出「專業全螢幕知識庫工作台」，不是行銷落地頁、不是空白後台。

■ 整體版型（必做）
- 全螢幕單頁 App：上方頂欄 + 下方主工作區
- 主工作區採「左｜右」兩欄，右欄再分「上｜下」：
  · 左欄：知識拓撲／導覽（可收合、可拖曳調寬）
  · 右上：內容詳情／閱讀區
  · 右下：AI 問答與筆記操作區
- 左右、上下之間要有可拖曳分隔條（雙擊可恢復預設比例）
- 桌面優先（≥1280px 舒適）；筆電上也要能用

■ 頂欄（深色）
- 背景：深 slate（約 #1e293b），白字
- 左側：圖示 + 產品名（大）+ 副標（小、較淡）
- 右側工具列（由左到右）：
  · 模型下拉選單
  · AI 連線狀態（例：AI：就緒／連線中／失敗）
  · 知識庫狀態（例：內部知識庫：已載入 N 筆）
  · 管理者按鈕（可次要）
  · 主行動按鈕「上傳知識庫 PDF／文件」（藍色實心）

■ 視覺風格（必遵守）
- 底色淺灰 #f3f4f6；面板白／半透明玻璃感（圓角 xl、輕陰影、細邊框）
- 語意配色：
  · 拓撲／導覽偏藍
  · 詳情區標題列淡藍底
  · 問答區標題列淡綠／emerald 底
  · 翻譯／便條偏琥珀黃
  · 危險／刪除偏紅
- 字體：繁中無襯線為主（介面）；長文閱讀區可稍大行高
- 資訊密度偏專業工具（小工具鈕 10–12px 可接受），但內容區要留白可讀
- 禁止：紫色 AI 套版、只有 wireframe、大片未排版白頁、emoji 堆砌

■ 空狀態
- 左欄無資料／未選節點時要有圖示＋一句指引（例：「請點左側節點查看內容」）
- 問答區一進來要有歡迎訊息，說明怎麼問、會依知識庫回答`,
  },
  {
    title: "區塊1｜知識拓撲＋節點詳情＋法令問答（主工作台）",
    body: `主工作台三區：左「知識拓撲」+ 右上「節點解析」+ 右下「內部問答」。

■ 左欄｜知識拓撲
功能：
- 標題：「知識拓撲（動態更新）」＋縮放 −／＋、重置版面、返回總覽
- 模式切換：【圖案】卡片／樹圖總覽 ｜【大綱】樹狀清單
- 麵包屑：顯示目前層級，可點回上層；Esc 回上一層
- 搜尋框：關鍵字找法規／主題；結果下拉可點進節點
- 點節點 → 右上詳情載入該節點內容
外觀：白底面板、藍系標題、淺底工具列；圖案模式可用淺網格＋白卡片節點

■ 右上｜知識節點解析
功能：
- 顯示節點標題、類型徽章（例：OECD／台灣法規／PDF／AI 匯入）
- 長文可捲動；標題／條次層級清楚（像法規排版）
- 工具列：字級 A−～A+、列印、匯出 PDF、便條紙（可選）
- 英文段落旁可有「翻譯」小鈕 → 黃色可拖曳浮動譯文窗
空狀態：置中圖示＋「請點擊左側節點…」

■ 右下｜AI 內部問答（核心）
功能：
- 模式切換：【內部問答】｜【匯入筆記】
- 對話區：使用者泡泡／AI 泡泡（AI 可用淡綠底）；可顯示檢索步驟摘要
- 輸入框（多行）＋主按鈕「提問」
- 回答格式固定四段：
  【推論思考】【正式回答】【查核實務重點】【參考依據】
- 引用必須標 [知識庫 N]，並可對回來源
- 回答後操作列：存筆記本、存入知識庫、匯出 Word／ODT／PDF
- 無依據：澄清或拒答，不得臆測；不可只丟判決／法律結論而無推論

■ RAG 參數（寫入設定、可調）
Chunk Size 1500、Overlap 100、Top-K 20、Reranker 開、Rerank 後 6、
Temperature 0.15、Context 32K、Max Output 一般 3K／複雜 9K、相似度門檻依模型校準

■ Markdown／知識庫
一主題一檔或一條一塊；front matter：title/version/owner/tags/生效日；易混淆主題分檔`,
  },
  {
    title: "區塊2｜專業翻譯（工作區＋對照＋單字）",
    body: `可做成右下模式之一，或頂部主 Tab；外觀須與主工作台同一套設計系統。

■ 介面配置（必做）
- 頂列：語向下拉（中→英、英→中、中→日、日→中）＋「開始翻譯」主按鈕（藍／綠實心）
- 主區左右或上下對照：
  · 左／上：原文（可貼上或從節點帶入）
  · 右／下：譯文（可編輯校正）
- 對照模式切換：並排｜分段對照
- 右側或抽屜：「單字教學」
  · 生字列表、例句、收藏
  · 點生字可在原文／譯文高亮
- 底列或工具列：存入筆記本、存入知識庫、匯出 Word／ODT／PDF
- 匯出排版：商業化（標題層級、頁眉頁腳、適當字級與間距、可離線開）

■ 行為
- 專業術語優先用知識庫詞彙表
- 使用者校正後可回寫術語（學習翻譯）
- 載入中、失敗、空原文都要有狀態提示
- 檔名含日期與語向

■ 外觀細節
- 延續玻璃面板＋圓角；翻譯輔助用琥珀／黃色點綴（可拖曳黃色譯文／便條窗）
- 對照區要好讀：清楚段落間距，不要擠成一團`,
  },
  {
    title: "區塊3｜一鍵去識別化（即時預覽＋對照表）",
    body: `做成完整可視工作區（不只隱藏在聊天裡的一顆按鈕）。

■ 介面配置（必做）
- 工具列：貼上原文／上傳檔、「一鍵去識別化」主鈕、匯出（Word／ODT／PDF）
- 主區雙欄即時預覽：
  · 左：原文
  · 右：去識別化後文本（隨對照表變更即時更新）
- 下方或側邊「對照表」面板（可摺疊，預設可展開）：
  · 欄位：原文實體｜代號｜類型｜是否套用（勾選）
  · 操作：新增列、刪除列、全選／取消
- 變更勾選／增刪後，右側預覽必須動態同步

■ 規則
- 自動抓取：出現「公司」＋數字／代號等模式（可設定正則清單）；亦可擴充人名／信箱／電話
- 代號排序：先 甲乙丙丁…，用盡後接 A B C D…
- 同一實體全文一致替換
- 對照表敏感：匯出時提示風險；可選「只匯出去識別化文本、不含對照表」

■ 外觀
- 對照表用清楚表格（斑馬紋或細線）；勾選要好點
- 主鈕明顯；危險操作（刪除）用次要／紅色樣式
- 與整體工作台同一設計語言（白面板、圓角、輕陰影）`,
  },
  {
    title: "區塊4｜筆記本與紀錄",
    body: `管理「存筆記本／匯出筆記」後的內容。

■ 介面配置（必做）
- 左：筆記列表（搜尋框、時間、來源標籤：問答／翻譯／去識別化／手動）
- 右：筆記編輯／預覽（標題、內文、來源連結、建立時間）
- 工具：新增、刪除、存檔、匯出 Word／ODT／PDF、回寫知識庫（需確認）
- 從問答區「存筆記本」進來時，應自動帶入四段結構與引用

■ 外觀
- 列表選中態清楚（左邊色條或淡底）
- 筆記閱讀可用稍大行高；可選襯線閱讀樣式，但介面控制項仍用無襯線
- 空狀態：「尚無筆記，先去問答區存一則」`,
  },
  {
    title: "區塊5｜上傳入庫與檔案管理（次要）",
    body: `對應頂欄「上傳知識庫 PDF」流程。

■ 上傳模態（必做，不要只有隱藏 input）
- 標題：上傳知識庫文件 — 選擇歸類
- 顯示檔名
- 三種模式（radio）：
  1) AI 自動分類（說明可再手動改）
  2) 掛到既有節點（下拉選父節點）
  3) 新建分類資料夾（選父節點＋新分類名稱）
- 選填：節點顯示關鍵字
- 勾選：是否用 AI 產摘要（較慢）
- 底：取消｜開始上傳（主色）
- 上傳中進度／成功 toast／失敗原因

■ 檔案列表頁（可次要選單）
- 欄位：檔名、類型、版本、入庫時間、狀態、下載／刪除
- 規則：格式白名單、大小上限、命名、重複檔、刪除策略都要寫進 README／設定`,
  },
  {
    title: "區塊6｜設定／參數／健康檢查（次要）",
    body: `■ 介面：設定頁分組表單（不要塞進主畫面四區）
分組：
1) RAG 參數：Chunk／Overlap／Top-K／Reranker／Temperature／Max Output／Context（顯示建議值與說明）
2) 模型連線：endpoint／模型名／逾時（可用環境變數，畫面可顯示狀態）
3) 匯出樣板：抬頭、浮水印「僅供內部分析」開關
4) 健康檢查：一鍵 GET 健康狀態 → 顯示 llm／vector／reranker ok 或失敗

■ 外觀：表單對齊、數字輸入＋建議值提示、儲存成功 toast`,
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

### A. 第一優先：可打開、好看、可點的工作台 UI
- 頂欄 + 左拓撲 + 右上詳情 + 右下問答 的三區工作台（或等價資訊架構）
- 問答／翻譯／去識別化／筆記本 都要有完整操作面
- 禁止只交目錄樹、空殼、未設計頁面

### B. 知識庫
- 入庫、metadata、版本、引用回原文

### C. Markdown／切塊與 RAG 參數
- Chunk／Overlap／Top-K／Reranker／Temperature／Max Output 可配置

### D. 上傳下載與匯出
- PDF／MD 上傳歸類模態；Word／ODT／PDF 匯出

### E. 安全與驗收
- 去識別化對照表敏感提示；黃金案例；失敗狀態 UX
`;
}

function buildUiSpec() {
  return `## UI／網頁呈現規格（必做）

### 版面（請照做）
1. **頂欄（深色 slate）**：品牌名、模型選擇、AI／知識庫狀態、上傳按鈕
2. **左欄知識拓撲**：圖案／大綱切換、搜尋、縮放、麵包屑、點節點開詳情；可收合；可拖曳調寬
3. **右上節點詳情**：標題、徽章、長文閱讀、字級、匯出 PDF、翻譯小鈕→黃色可拖曳浮動窗
4. **右下 AI 區**：內部問答／匯入筆記切換、對話泡泡、輸入框、提問、去識別化、存筆記本、Word／ODT／PDF
5. 另可用 Tab 或模式進入：翻譯工作區、去識別化雙欄預覽、筆記本列表

### 視覺
- 底 #f3f4f6；玻璃白面板、圓角、輕陰影
- 藍＝導覽／詳情；綠＝問答；琥珀＝翻譯／便條；勿用紫系套版
- 專業資訊密度 + 可讀留白；繁中 UI

### 互動品質
- hover／disabled／loading／空狀態／錯誤紅底說明
- 分隔條可拖；toast 提示儲存／上傳結果

### 第一回合交付防呆
- 瀏覽器一打開就是完整工作台畫面（可用 mock 資料）
- 能點左節點看到右上假資料；能在右下送出問題看到四段式假回答與引用
- **禁止**第一回合只交結構檔／README／無 CSS 的表格頁
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
- 目標：做出「專業知識庫工作台」——不是行銷頁、不是只有資料夾的專案骨架
- 必須同時有：(1) 好看可操作 UI (2) 知識庫／參數／匯出等整套能力

## 1. 背景與目標
${goal}

## 2. 使用者與場景
- 主要使用者：${users}
- 場景：查法規／問答／翻譯／去識別化／存筆記／匯出，需可追溯可覆核

## 3. 驗收標準
- 打開網頁即見頂欄＋三區工作台（或等價）
- 左點節點 → 右上出內容；右下可問答並見四段結構與引用
- 翻譯、去識別化、筆記本皆有完整操作面與匯出
- 上傳入庫有模態流程；參數可配置
- UI 達到「內行人能直接上手使用」的完成度

${buildUiSpec()}

## 4. 功能區塊明細

${blocksMd}

## 5. 技術偏好
${stack}

## 6. 非功能
- 繁中；P95 互動盡量 < 8 秒（長匯出可另標）
- 內部工具安全；對照表敏感提示
- 參數不寫死

## 7. 排除
- 不取代正式法律意見；不可無依據臆測
- 不交只有結構沒有介面的交付物

## 8. 交付物
1. 可瀏覽器打開的漂亮工作台（第 1 優先）
2. README（啟動、匯入示範資料、參數）
3. 示範知識內容＋匯出樣張
4. 實作對照清單

${buildSystemChecklist()}

## 9. 實作順序（強制）
1. **第 1 回合**：完整 UI 殼（頂欄＋左拓撲＋右上詳情＋右下問答）＋ mock 資料可點
2. 第 2 回合：RAG 問答接真資料＋引用
3. 第 3 回合：去識別化雙欄＋對照表即時更新＋匯出
4. 第 4 回合：翻譯對照、筆記本、上傳模態、設定頁
`;
}

function buildPrompt() {
  const name = wsEl("wsProjectName")?.value.trim() || "未命名專案";
  const goal = wsEl("wsGoal")?.value.trim() || "";
  const users = wsEl("wsUsers")?.value.trim() || "";
  const stack = wsEl("wsStack")?.value.trim() || "";

  const blockList = wsBlocks
    .map((b, i) => `【${b.title}】\n${b.body}`)
    .join("\n\n");

  return `你是資深全端工程師 + 產品級 UI 設計師。
請做出一個專業單頁「知識庫工作台」，不是行銷頁，也不是只有資料夾結構。

# 專案：${name}

## 目標
${goal}

## 使用者
${users}

## 技術
${stack}

---

## ⚠ 你必須先做出來的畫面（第 1 回合就做，可用 mock）

請照下列資訊架構與完成度實作：

1. **頂欄（深色 slate）**
   - 左：圖示 + 標題 + 副標
   - 右：模型下拉、AI 狀態、知識庫狀態、上傳知識庫按鈕（藍色實心）

2. **左欄「知識拓撲」**
   - 工具：縮放、重置、返回總覽
   - 圖案／大綱切換、麵包屑、搜尋
   - 可點節點；可收合；可拖曳調左右寬

3. **右上「知識節點解析」**
   - 點左節點後顯示標題、徽章、長文
   - 字級、匯出 PDF；英文旁可有翻譯→黃色浮動譯文窗
   - 未選節點時空狀態指引

4. **右下「AI 筆記與內部問答」**
   - 內部問答／匯入筆記切換
   - 對話泡泡、多行輸入、提問鈕、去識別化
   - 回答四段：推論思考／正式回答／查核實務重點／參考依據，引用 [知識庫 N]
   - 操作：存筆記本、存知識庫、Word／ODT／PDF

視覺：底 #f3f4f6、白玻璃面板、藍／綠／琥珀語意色、圓角輕陰影、專業密度。
禁止紫色套版、禁止第一回合只交目錄／README／無設計頁。

另需能進入：翻譯對照工作區、去識別化雙欄＋對照表、筆記本列表（可 Tab 或模式切換）。

---

## 功能明細（請全部納入設計）

${blockList}

---

## 實作規則
- **第 1 回合直接交可打開的 HTML/CSS/JS（或同等前端）工作台**，mock 資料也要能點完主流程
- 之後再接真 RAG／匯出／上傳；但架構一次想好
- 法令問答不得臆測；去識別化甲乙丙丁→ABCD 且即時同步；翻譯要對照與匯出美觀
- 每次回覆寫清：怎麼打開網頁、點哪裡測 4 條主路徑

## 開始前
用 ≤5 點複述需求，必須包含：「會先做出頂欄＋左拓撲＋右上詳情＋右下問答的完整工作台 UI，不會只交結構檔」。
然後立刻開始做第 1 回合畫面。`;
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
      body: "請描述：版面位置、外觀、按鈕、操作流程、規則、匯出、與其他區塊如何串接。",
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
