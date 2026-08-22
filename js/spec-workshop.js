/* SPEC / PROMPT Workshop — generate Claude-ready specs */

const DEMO_BLOCKS = [
  {
    title: "區塊1｜法令知識庫問答",
    body: `功能目標：提供法令／規範知識庫，使用者可用自然語言問答。

【介面】此區塊是主畫面 4 大 Tab／導覽之一，必須有：提問框、送出、答案區、引用列表、信心標示、低信心時的澄清提示。

必須做到：
- 回答只能依據「已入庫的法令知識庫」內容，不可超出規則臆測
- 要能深度分析後再推理回答（先推論思考 → 正式回答 → 實務重點 → 參考依據）
- 低信心或依據不足時：回問澄清或拒答，不得硬答
- 必須標註引用（chunk／條次／文件來源）

建議 RAG 參數（可寫入設定檔、可調）：
- Chunk Size：1500 tokens（法規／教材小節）
- Chunk Overlap：100 tokens
- Vector Search Top-K：20
- Reranker：開啟；Rerank 後 Top-K：6
- Temperature：0.15
- Context Length：建議 32K
- Max Output：一般 3000 tokens；複雜查核論述可至 9000 tokens
- 相似度門檻：依 embedding 模型分數分布校準，不寫死

知識庫／Markdown 規則：
- 一主題一檔或一條／一點一塊；標題層級清楚
- Front matter 含：title、version、owner、生效日、tags
- 禁止把互相易混淆主題混在同一 chunk（例如不同避風港）`,
  },
  {
    title: "區塊2｜專業翻譯",
    body: `功能目標：專業翻譯工作區（非隨便機器翻譯）。

【介面】此區塊是主畫面 4 大區塊之一，必須有：語向選擇、原文區、譯文區、對照切換、單字教學側欄／抽屜、存入筆記／知識庫、匯出按鈕。版面要好看、商業化。

語向：
- 中→英、英→中、中→日、日→中

必須做到：
- 可學習翻譯風格／術語（可從知識庫或使用者校正中學習）
- 教導單字功能（生字、例句、可收藏）
- 譯文對照檢視（原文／譯文並排或分段對照，可切換）
- 可存入知識庫或筆記本
- 可匯出 Word、ODT、PDF；排版需商業化、專業、好看（標題層級、頁眉頁腳、適當間距與字級）

約束：
- 專業領域術語優先採用知識庫詞彙表
- 匯出檔需可離線開啟；檔名含日期與語向`,
  },
  {
    title: "區塊3｜一鍵去識別化",
    body: `功能目標：文件一鍵去識別化，保護敏感名稱後仍可分析／匯出。

【介面】此區塊是主畫面 4 大區塊之一，必須有：貼上／上傳原文、一鍵去識別化、左右或上下即時預覽、對照表（可勾選／新增／刪除）、匯出 Word／ODT／PDF。變更要即時反映在預覽。

自動抓取規則：
- 以出現「公司」＋數字等字串模式判斷（例如「公司2」「公司A」類實體；實作時請支援可設定的正則／規則清單）
- 自動去識別化為「甲、乙、丙、丁…」排序；該輪用完後接「A、B、C、D…」
- 必須產生「原文 ↔ 代號」對照表

互動與修正：
- 沒抓到的可手動新增
- 抓錯的可刪除
- 每一筆可勾選「是否參與去識別化」
- 變更後要動態即時更新預覽（去識別化文本＋對照表同步）

匯出：
- 去識別化後文本、對照表，皆可下載 Word、ODT、PDF

安全：
- 對照表屬敏感資料，下載需明確提示；可選僅匯出去識別化文本`,
  },
  {
    title: "區塊4｜筆記本與紀錄",
    body: `功能目標：把問答、翻譯、去識別化結果存成可管理的筆記。

【介面】此區塊是主畫面 4 大區塊之一，必須有：筆記列表、搜尋、編輯區、來源標籤、匯出與回寫知識庫按鈕。列表與編輯並排更好用。

必須做到：
- 新增／編輯／刪除／搜尋筆記
- 筆記可關聯來源（知識庫 chunk、上傳檔、翻譯任務）
- 可再匯出 Word／ODT／PDF
- 可把精華筆記回寫入知識庫（需確認版本與 metadata）`,
  },
  {
    title: "區塊5｜上傳下載與檔案管理（次要選單）",
    body: `功能目標：統一管理上傳、解析、下載連結與版本。

【介面】可放在「檔案」次要選單，不必佔主畫面 4 大 Tab，但要有完整頁面：上傳區、檔案列表、狀態、下載連結。

必須做到：
- 支援上傳：PDF／DOCX／ODT／TXT／MD（可表列實際支援格式）
- 上傳後解析 → 可入知識庫或進翻譯／去識別化流程
- 每個產出保留「下載連結／檔案紀錄」（誰在何時產出、來源檔、版本）
- 檔名規則、容量上限、重複檔處理、刪除與回收策略都要定義
- 失敗時有明確錯誤訊息與可重試`,
  },
  {
    title: "區塊6｜系統設定、權限與參數中心（次要選單）",
    body: `功能目標：把模型、RAG 參數、匯出樣式、權限做成可配置，而非寫死在畫面。

【介面】可放在「設定」次要選單；表單清楚分組，不要一進站就塞滿主畫面。

必須做到：
- RAG／生成參數設定頁（與區塊1參數一致，可存成設定檔）
- 使用者／角色權限（例如僅內部登入可用）
- 匯出樣板（公司抬頭、浮水印「僅供內部分析」等可開關）
- 健康檢查：模型、向量庫、匯出服務是否就緒
- 操作稽核日誌（可匿名化）`,
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
      <textarea class="ws-block-body" data-i="${i}" rows="8" placeholder="這個區塊要有什麼功能、規則、參數…">${escapeHtml(b.body)}</textarea>
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
  return `## 整套系統必做清單（禁止只做網頁／UI；也禁止只做資料夾結構）

請 Claude 實作時，下列每一項都要有設計與落地：

### A. 先交付「可打開、好看、可點」的網頁（第一優先）
- 單一入口網頁（或明確首頁）：一打開就能看到 **4 個主要功能區塊** 並可切換使用
- 不是 README 目錄樹、不是空殼元件清單；要有實際版面、按鈕、表單、結果區
- UI 要專業好看（見下方「UI 設計規格」）

### B. 知識庫
- 文件如何入庫、更新、版本並存或覆蓋
- metadata 欄位（title／version／owner／tags／權限）
- 檢索與引用如何對回原文

### C. Markdown／切塊規則
- 標題層級、列表、表格怎麼切 chunk
- Chunk Size／Overlap 預設值與設定檔位置
- 易混淆主題分檔規則

### D. RAG／生成參數
- Top-K、Reranker、Temperature、Max Output、Context、相似度門檻
- 參數可調、有預設、有說明；不要寫死在程式各處

### E. 上傳／下載與檔案管理
- 允許格式、大小上限、錯誤提示
- 產出檔命名、存放、下載連結、版本、刪除規則
- Word／ODT／PDF 匯出管線

### F. 權限、安全、驗收
- 內部工具登入／角色（若需要）
- 黃金驗收情境；明確排除範圍
`;
}

function buildUiSpec() {
  return `## UI／網頁呈現規格（必做，不可省略）

### 使用者一打開就要看到什麼
- **首頁／主畫面必須直接呈現 4 個主要功能區塊**，讓使用者可以點選切換並實際操作：
  1. 法令知識庫問答
  2. 專業翻譯
  3. 一鍵去識別化
  4. 筆記本與紀錄
- 可用頂部 Tab、左側導覽或卡片入口；**切換後該區塊的操作介面要完整可用**（輸入區、動作按鈕、結果區、匯出／儲存）。
- 區塊 5（檔案管理）、區塊 6（設定／參數）可放在次要選單，但主畫面 4 大區塊不可缺。

### 視覺與互動（要好看，不是預設醜版）
- 繁體中文、專業內部工具風格；科技感但輕快透明（可用玻璃擬態、柔和漸層、清楚層級）
- **不要**交：只有資料夾／空 HTML、純表格後台、未排版的預設字體堆疊、紫色漸層套版、只有 wireframe
- 要有：清楚字階與間距、主色／輔助色、卡片或分區、按鈕狀態（hover／disabled）、空狀態說明、載入中提示、錯誤提示
- 桌面優先，同時要能在常見筆電寬度正常使用；重點操作一屏可理解
- 每個主區塊至少包含：標題、簡短說明、主要操作區、結果／預覽區

### 第一回合交付標準（防呆）
- 用瀏覽器打開就能操作 4 大區塊的切換與基本互動（可用 mock／示範資料先跑通畫面）
- **禁止第一回合只交**：目錄結構、SPEC 複述、後端骨架、沒有設計的空白頁
- 正確順序：**先做出好看可點的 UI 殼＋4 區塊** → 再接知識庫／API／匯出邏輯
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
- 本 SPEC 給實作助手（Claude）與工程師對齊用
- **必須同時做到兩件事**：
  1. **好看、可點、一打開就有 4 大功能區塊的網頁 UI**
  2. **可運作的整套系統**（知識庫／參數／匯出／檔案規則）
- **禁止**：只交資料夾結構、只交後端骨架、只有 README、空白或未設計的頁面

## 1. 背景與目標
${goal}

## 2. 使用者與場景
- 主要使用者：${users}
- 場景：內部專業工作（問答、翻譯、去識別化、匯出），需要可追溯、可覆核

## 3. 成功長什麼樣（可驗收）
- **瀏覽器打開首頁，立刻看到並能切換 4 個主功能區塊**（問答／翻譯／去識別化／筆記本）
- UI 專業好看，不是預設醜版或空殼
- 每個主區塊可走完：輸入→處理→結果／預覽→儲存或匯出（可用示範資料）
- 法令問答有引用且低信心不瞎掰
- 翻譯可對照、可存、可匯出商業化排版檔
- 去識別化有對照表、可增刪勾選、即時更新、可匯出
- 檔案上傳下載與知識庫規則可配置、可說明

${buildUiSpec()}

## 4. 功能區塊

${blocksMd}

## 5. 非功能需求
- 語系：繁體中文 UI
- 效能：一般互動 P95 盡量 < 8 秒（長文件匯出可另標）
- 安全：內部工具需登入或同等保護；敏感對照表不可預設外洩
- 可維護：參數與規則進設定／文件，不散落魔術數字

## 6. 技術偏好
${stack}

## 7. 資料與整合
- 知識庫、筆記本、上傳檔、匯出檔需有一致的 ID／版本概念
- 匯出格式：Word（.docx）、ODT、PDF
- 若呼叫外部模型 API：寫清端點、錯誤碼、timeout、限流假設

## 8. 排除（不做什麼）
- 不取代正式法律意見或法院判決；不可僅給結論而無推論與依據
- 不把去識別化當成「不可逆銷毀唯一真相」——對照表存在時要標示風險
- 不做與本 SPEC 無關的行銷型落地頁堆砌
- **不做「只有專案結構沒有介面」的交付**

## 9. 交付物
1. **可直接用瀏覽器打開的漂亮網頁**（4 大區塊可切換操作）
2. 可運行系統（含 README：如何啟動、設定參數、匯入知識庫）
3. SPEC 對照實作清單（哪些已做／未做）
4. 至少一組示範資料（法令片段、翻譯樣例、去識別化樣例）
5. 匯出樣張（Word／ODT／PDF 各一）

${buildSystemChecklist()}

## 10. 建議實作順序（強制）
1. **第 1 回合（必做）**：完成好看的主畫面 UI＋4 大區塊切換與基本操作殼（可用 mock 資料）
2. 第 2 回合：區塊1 問答接上知識庫檢索→生成→引用
3. 第 3 回合：區塊3 去識別化即時預覽＋對照表＋匯出
4. 第 4 回合：區塊2 翻譯對照＋匯出；區塊4 筆記；再補檔案管理與參數中心
`;
}

function buildPrompt() {
  const name = wsEl("wsProjectName")?.value.trim() || "未命名專案";
  const goal = wsEl("wsGoal")?.value.trim() || "";
  const users = wsEl("wsUsers")?.value.trim() || "";
  const stack = wsEl("wsStack")?.value.trim() || "";

  const blockList = wsBlocks
    .map((b, i) => {
      const n = i + 1;
      return `【區塊${n}：${b.title}】\n${b.body}`;
    })
    .join("\n\n");

  return `你是資深全端／AI 應用工程師，同時也是產品級 UI 設計師。
你熟悉知識庫（RAG）、文件匯出、內部工具安全，也會做出「專業、好看、可直接給人用」的網頁介面。

# 專案：${name}

## 一句話目標
${goal}

## 使用者
${users}

## 技術偏好
${stack}

---

## ⚠ 最重要的交付規則（請先讀完再動手）

你常犯的錯是：只交資料夾結構、後端骨架、README，卻沒有一個「打開就能用、而且好看」的網頁。
這次**絕對不行**。

### 你必須做到
1. **做出一個可直接用瀏覽器打開的網頁介面**（漂亮、完整、可互動）
2. **網頁上要直接有 4 個主要功能區塊給我使用**，一進站就能點選切換：
   - 區塊1：法令知識庫問答
   - 區塊2：專業翻譯
   - 區塊3：一鍵去識別化
   - 區塊4：筆記本與紀錄
3. 每個區塊都要有：標題說明、輸入／操作區、結果／預覽區、主要按鈕（送出、匯出、儲存等）
4. 同時規劃整套系統（知識庫、Markdown、參數、上傳下載），但**第一回合先把 UI 做好看可用**

### 明確禁止
- 禁止第一回合只交：目錄樹、空檔案、只有 API 沒有畫面、未設計的預設 HTML
- 禁止只有「結構說明」沒有實際畫面
- 禁止醜陋的未排版介面（大片白底＋預設按鈕就算交差）

### UI 設計要求（要好看）
- 繁體中文；專業內部工具＋輕科技感（玻璃感、柔和漸層、清楚層級、舒適留白）
- 有導覽／Tab 切換 4 大區塊；切換有過渡，狀態清楚
- 字階、間距、主色／強調色一致；按鈕有 hover／disabled
- 有空狀態、載入中、錯誤提示
- 桌面寬度優先，筆電上也好用
- 不要用俗套的紫色 AI 漸層套版

---

## 功能區塊細節

${blockList}

---

## 實作順序（強制）
**第 1 回合（現在就做這個）**
- 完成完整網頁 UI：頂部品牌／導覽＋4 大區塊可切換
- 每個區塊放好操作殼與示範資料（mock 即可），讓我打開就能點、能輸入、能看到結果區長怎樣
- 順便給出整體架構草圖（一頁說明即可）

**第 2 回合之後**
- 接知識庫／RAG、去識別化邏輯、翻譯、匯出 Word／ODT／PDF、檔案管理、參數中心

## 你必須同時設計（可分回合落地，但架構要想到）
1. 知識庫：入庫、metadata、更新、引用回原文
2. Markdown／切塊與參數（Chunk／Overlap／Top-K／Reranker／Temperature／Max Output）
3. 上傳下載與檔案管理規則
4. Word／ODT／PDF 匯出
5. 錯誤處理、權限、黃金驗收案例
6. README：如何啟動、如何打開網頁

## 領域規則（功能正確性）
- 法令問答：無足夠依據不得臆測；要深度分析再推理；必須引用
- 不可僅提供最終法院判決或法律建議卻沒有推論過程
- 去識別化：甲乙丙丁用盡後接 ABCD；對照表與預覽即時同步；可新增／刪除／勾選
- 翻譯：中英／英中／中日／日中；對照；可存知識庫／筆記本；匯出要商業化排版

## 每次回覆格式
1. 本回合交付了什麼（特別寫：網頁怎麼打開、4 區塊在哪裡點）
2. 畫面／互動說明（截圖級文字描述也可）
3. 檔案清單
4. 我要怎麼測試（逐步點擊路徑）
5. 下一步

開始前先用 5 條以內複述你對需求的理解，重點必須包含：
「會先做出好看且可點的 4 區塊網頁，不會只交結構檔」。
然後直接開始做第 1 回合，不必等我再說「開始做」。`;
}

function refreshWsOutput() {
  const out = wsEl("wsOutput");
  if (!out) return;
  const text = wsCache[wsActiveTab] || "尚未產生。請先按「產生給 Claude 的 SPEC＋PROMPT」。";
  out.textContent = text;
}

function generateWs() {
  readWsBlocksFromDom();
  if (!wsBlocks.length) {
    loadDemoBlocks();
  }
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

  wsEl("wsLoadDemo")?.addEventListener("click", () => {
    loadDemoBlocks();
  });

  wsEl("wsAddBlock")?.addEventListener("click", () => {
    readWsBlocksFromDom();
    wsBlocks.push({
      title: `區塊${wsBlocks.length + 1}｜新功能`,
      body: "請描述：輸入、輸出、規則、排除、與其他區塊如何串接。",
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
