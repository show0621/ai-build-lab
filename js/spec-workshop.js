/* SPEC / PROMPT Workshop — generate Claude-ready specs */

const DEMO_BLOCKS = [
  {
    title: "區塊1｜法令知識庫問答",
    body: `功能目標：提供法令／規範知識庫，使用者可用自然語言問答。

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

必須做到：
- 新增／編輯／刪除／搜尋筆記
- 筆記可關聯來源（知識庫 chunk、上傳檔、翻譯任務）
- 可再匯出 Word／ODT／PDF
- 可把精華筆記回寫入知識庫（需確認版本與 metadata）`,
  },
  {
    title: "區塊5｜上傳下載與檔案管理",
    body: `功能目標：統一管理上傳、解析、下載連結與版本。

必須做到：
- 支援上傳：PDF／DOCX／ODT／TXT／MD（可表列實際支援格式）
- 上傳後解析 → 可入知識庫或進翻譯／去識別化流程
- 每個產出保留「下載連結／檔案紀錄」（誰在何時產出、來源檔、版本）
- 檔名規則、容量上限、重複檔處理、刪除與回收策略都要定義
- 失敗時有明確錯誤訊息與可重試`,
  },
  {
    title: "區塊6｜系統設定、權限與參數中心",
    body: `功能目標：把模型、RAG 參數、匯出樣式、權限做成可配置，而非寫死在畫面。

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
  return `## 整套系統必做清單（禁止只做網頁／UI）

請 Claude 實作時，下列每一項都要有設計與落地，不能只畫介面：

### 1. 知識庫
- 文件如何入庫、更新、版本並存或覆蓋
- metadata 欄位（title／version／owner／tags／權限）
- 檢索與引用如何對回原文

### 2. Markdown／切塊規則
- 標題層級、列表、表格怎麼切 chunk
- Chunk Size／Overlap 預設值與設定檔位置
- 易混淆主題分檔規則

### 3. RAG／生成參數
- Top-K、Reranker、Temperature、Max Output、Context、相似度門檻
- 參數可調、有預設、有說明；不要寫死在程式各處

### 4. 上傳／下載與檔案管理
- 允許格式、大小上限、病毒／異常檔處理策略（至少錯誤提示）
- 產出檔命名、存放、下載連結、過期或刪除規則
- Word／ODT／PDF 匯出管線與失敗重試

### 5. 資料流與狀態
- 各區塊如何共用同一份文件／任務 ID
- 去識別化對照表等敏感資料的存放與匯出提示

### 6. 權限、安全、稽核
- 登入／角色（若為內部工具）
- 不可把敏感對照表預設公開
- 重要操作有紀錄

### 7. 錯誤處理與驗收
- 無資料、模型失敗、匯出失敗的 UX
- 黃金驗收情境（每區塊至少 2～3 條可測案例）
- 明確「不做什麼」（排除範圍）
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
- **禁止只做網頁外觀或靜態 UI**；必須交付可運作的整套系統（前端＋資料／知識庫＋匯出＋參數＋檔案規則）

## 1. 背景與目標
${goal}

## 2. 使用者與場景
- 主要使用者：${users}
- 場景：內部專業工作（問答、翻譯、去識別化、匯出），需要可追溯、可覆核

## 3. 成功長什麼樣（可驗收）
- 每個功能區塊可獨立走完主路徑（輸入→處理→輸出／匯出）
- 法令問答有引用且低信心不瞎掰
- 翻譯可對照、可存、可匯出商業化排版檔
- 去識別化有對照表、可增刪勾選、即時更新、可匯出
- 檔案上傳下載與知識庫規則可配置、可說明

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

## 9. 交付物
1. 可運行系統（含 README：如何啟動、設定參數、匯入知識庫）
2. SPEC 對照實作清單（哪些已做／未做）
3. 至少一組示範資料（法令片段、翻譯樣例、去識別化樣例）
4. 匯出樣張（Word／ODT／PDF 各一）

${buildSystemChecklist()}

## 10. 建議實作順序（MVP → V1）
1. MVP：區塊1 問答主路徑（檢索→生成→引用）＋簡單上傳 MD/TXT
2. MVP：區塊3 去識別化預覽＋對照表＋勾選即時更新
3. V1：區塊2 翻譯對照＋匯出
4. V1：區塊4～6 筆記、檔案管理、參數中心
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

  return `你是資深全端／AI 應用工程師，也熟悉知識庫（RAG）、文件匯出與內部工具安全。

我要你依下列 SPEC 幫我「整套系統」實作，不是只做網頁或 UI 假畫面。

# 專案：${name}

## 一句話目標
${goal}

## 使用者
${users}

## 技術偏好
${stack}

## 功能區塊（請全部納入設計；可先 MVP 再加深，但架構要一次想好）

${blockList}

## 你必須同時設計並實作（或先給完整架構再分步落地）
1. 知識庫：入庫、metadata、更新策略、引用回原文
2. Markdown／切塊規則與預設參數（Chunk Size／Overlap／Top-K／Reranker／Temperature／Max Output 等）
3. 上傳／下載與檔案管理規則（格式、命名、下載連結、版本、刪除）
4. Word／ODT／PDF 匯出（翻譯、去識別化文本、對照表、筆記）
5. 錯誤處理、權限、驗收用黃金案例
6. README：如何啟動、如何設定、如何匯入示範資料

## 回答與實作規則
- 先給整體架構與資料流，再開始寫程式
- 每完成一個區塊，列出：已完成項目、如何手動測試、尚未完成項目
- 法令問答：無足夠依據不得臆測；要能深度分析再推理；必須引用
- 不可僅提供最終法院判決或法律建議卻沒有推論過程
- 去識別化：甲乙丙丁用盡後接 ABCD；對照表與預覽即時同步；可新增／刪除／勾選
- 翻譯：中英／英中／中日／日中；對照；可存知識庫／筆記本；匯出要商業化排版
- 不要只交靜態 HTML 樣子；要有可運行邏輯與清楚模組切分

## 輸出格式（每次回覆）
1. 目前進度
2. 架構／資料流（若尚未給過）
3. 本回合實作內容（檔案清單）
4. 我要怎麼測試
5. 下一步建議

請確認已理解：這是「整套系統」不是「只有網頁 UI」。開始前先用條列複述你對需求的理解，等我回「開始做」後再寫程式。`;
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
