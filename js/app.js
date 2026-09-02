/* AI Build Lab — interactions */

const SECTIONS = ["hero", "plan", "flow", "spec", "prompt", "api", "kb", "params", "case", "ainote", "summary", "collab", "loop", "workshop"];

const SECTION_TITLES = {
  plan: "構想",
  flow: "流程圖",
  spec: "SPEC",
  prompt: "PROMPT",
  api: "API",
  kb: "知識庫",
  params: "參數",
  case: "案例",
  ainote: "NOTE架構",
  collab: "協作",
  summary: "總結",
  loop: "回饋",
  workshop: "SPEC工坊",
};

const FLOW_COPY = {
  start: {
    title: "開始 · 使用者提問",
    body: "把問題當入口事件。SPEC 要寫清楚：長度限制、是否允許上傳附件、需要哪些使用者資訊。",
    tip: "trigger: user_query\nmax_chars: 500\nlanguage: zh-Hant",
  },
  retrieve: {
    title: "檢索 · 向量索引檢索",
    body: "用 Embedding（文字→座標）在向量索引裡找意思相近的段落。Top-K 建議先 15～20，寧可多撈再交給 Reranker 精煉。",
    tip: "vector_search.top_k = 20\nchunk_size ≈ 1500\noverlap ≈ 100",
  },
  enough: {
    title: "判斷 · 是否足夠？",
    body: "看相似度分數與重排後分數。不夠就走回退，不要硬答。門檻依 embedding 模型調整，不要寫死唯一數字。",
    tip: "if max_score < threshold → fallback\nelse → generate",
  },
  rerank: {
    title: "Rerank · 重排精煉",
    body: "強烈建議開啟。先寬抓、再精選，把最終進 context 的段落壓到 5～8（建議 6）。",
    tip: "reranker: on\npost_rerank_top_k = 6",
  },
  fallback: {
    title: "回退 · 澄清或拒答",
    body: "低信心時：請使用者改寫問題、補關鍵字，或明確說知識庫沒有依據。這是信任的關鍵。",
    tip: "response_mode: clarify | refuse\nnever_hallucinate: true",
  },
  answer: {
    title: "生成答案 · 附引用",
    body: "Temperature 偏低（0.15）求穩定。輸出要帶來源 chunk，方便人工對照。",
    tip: "temperature = 0.15\nmax_output ≈ 3K\ncite_sources: required",
  },
  end: {
    title: "結束",
    body: "記錄這次問答（可匿名）供之後調參與黃金問題集擴充。",
    tip: "log: query_id, latency, citations, feedback",
  },
};

const PROMPT_LAYERS = {
  role: `你是「公司內部規章查核助理」。只根據提供的知識庫段落回答，語氣清楚、可執行。`,
  task: `任務：回答使用者關於請假 / 報銷 / 資安的問題，並標註依據段落。`,
  context: `情境知識：\n{{retrieved_chunks}}\n若段落彼此衝突，指出衝突並建議向 HR 確認。`,
  format: `輸出格式（JSON）：\n{\n  "answer": "...",\n  "citations": [{"chunk_id": "...", "quote": "..."}],\n  "confidence": "high|medium|low",\n  "follow_up": "..."\n}`,
  rules: `規則：\n1. 沒有足夠依據時，confidence 必須為 low，且不得臆測。\n2. 不可僅提供最終法院判決（或條文結論）；亦不可只給法律建議卻沒有推論過程——須附推論、引用依據與不確定事項。\n3. 回答使用繁體中文。`,
};

const API_COPY = {
  baseurl: {
    title: "Base URL｜模型／閘道網址",
    html: `
      <p class="api-plain"><strong>白話：</strong>告訴程式「廚房在哪個地址」。沒寫網址，畫面再漂亮也叫不到 AI。</p>
      <dl class="kv">
        <dt>常見例子</dt><dd>OpenAI 相容：<code>https://api.openai.com/v1</code>；Anthropic、Azure、單位內部閘道則換成各自文件上的 Base URL</dd>
        <dt>設定頁欄位</dt><dd>「API Base URL」輸入框＋「測試連線」按鈕（打 health 或 list models）</dd>
        <dt>寫進 SPEC</dt><dd>預設值、可否由使用者改、結尾要不要帶 <code>/v1</code>、CORS／代理注意</dd>
        <dt>失敗</dt><dd>網址錯、HTTPS 憑證、被防火牆擋 → UI 顯示「連線失敗：請檢查網址」</dd>
      </dl>
      <pre class="code-block">設定例：
API Base URL = https://api.openai.com/v1
測試：GET {base}/models 或你們的 /health</pre>`,
  },
  model: {
    title: "模型名稱｜請求要帶哪個 model",
    html: `
      <p class="api-plain"><strong>白話：</strong>同一間餐廳可能有多個主廚。模型名告訴伺服器「這次請哪一位」。頂欄下拉的選項應來自設定，不要寫死在程式裡。</p>
      <dl class="kv">
        <dt>設定頁</dt><dd>「預設模型」文字欄或下拉（可手動貼 model id）</dd>
        <dt>請求哪裡帶</dt><dd>通常在 JSON body：<code>{"model":"gpt-4o","messages":[…]}</code></dd>
        <dt>寫進 SPEC</dt><dd>預設模型、允許清單、與 Max Output／Context 建議值的對應</dd>
        <dt>失敗</dt><dd>404／model_not_found → 提示「模型名稱無效，請到設定修改」</dd>
      </dl>`,
  },
  auth: {
    title: "驗證機制｜誰有資格叫廚房",
    html: `
      <p class="api-plain"><strong>白話：</strong>服務生要看通行證。沒帶對的驗證標頭，伺服器會回 401／403。</p>
      <dl class="kv">
        <dt>最常見</dt><dd><code>Authorization: Bearer &lt;API_KEY&gt;</code></dd>
        <dt>其他</dt><dd><code>x-api-key: &lt;KEY&gt;</code>；Azure 可能還要 <code>api-key</code> 或資源名稱；有的要額外 org／project header</dd>
        <dt>寫進 SPEC</dt><dd>用哪一種、標頭名稱、是否還要第二道內部登入（使用者 JWT）與模型金鑰分開</dd>
        <dt>教學口訣</dt><dd><strong>業務 API</strong>（問答／入庫）可以要「登入 token（JWT＝身分憑證）」；<strong>叫外部語言模型（LLM）</strong>要「供應商 API Key」——兩者不要混成同一個欄位說明不清。</dd>
      </dl>
      <pre class="code-block">Authorization: Bearer sk-••••••••
Content-Type: application/json</pre>`,
  },
  apikey: {
    title: "API Key｜怎麼貼上、載入、存放",
    html: `
      <p class="api-plain"><strong>白話：</strong>金鑰像廚房密碼。要讓使用者在「設定頁」貼上；程式啟動時載入；存的地方要分「教學示範」與「正式上線」。</p>
      <dl class="kv">
        <dt>載入方式（教學／本機 Demo）</dt><dd>設定頁密碼框貼上 Key → 按「儲存」→ 寫入 <code>localStorage</code>（或 sessionStorage）→ 之後請求從記憶體／storage 讀出組 Header。畫面只顯示遮罩（sk-••••）</dd>
        <dt>正式建議</dt><dd>Key 只放<strong>伺服器</strong>環境變數（<code>.env</code>／密鑰庫），前端只打自家後端；瀏覽器<strong>不要</strong>長期存正式生產金鑰。<code>.env</code> 加入 <code>.gitignore</code>，絕不可提交</dd>
        <dt>UI 必做</dt><dd>貼上框、顯示／隱藏、儲存、清除、連線測試；頂欄顯示「AI：就緒／未設定 Key／驗證失敗」</dd>
        <dt>安全</dt><dd>日誌與錯誤訊息不可印出完整 Key；匯出設定檔預設不含 Key</dd>
      </dl>
      <pre class="code-block">// Demo 流程（寫進 PROMPT 給 Codex）
1. 設定頁輸入 API Key
2. localStorage.setItem("app_api_key", key)  // 僅示範
3. fetch(base + "/chat/completions", {
     headers: { Authorization: "Bearer " + key }
   })
4. 提供「清除金鑰」按鈕</pre>
      <p class="api-plain"><strong>寫進 SPEC 的一句話：</strong>「示範版允許設定頁貼 Key 存本機；正式版改走後端代理＋環境變數，並在 README 註明差異。」</p>`,
  },
  chat: {
    title: "POST /v1/chat/query｜問答窗口",
    html: `
      <p class="api-plain"><strong>白話：</strong>這是「使用者按下送出問題」時，網頁叫後端做事的窗口。網頁把問題送出去，後端先依意思從知識庫撈相關段落並重排精選，再請語言模型寫答案＋引用送回來。</p>
      <p class="api-plain"><strong>為什麼叫 POST？</strong>因為你在「送一份資料進去請對方處理」，不是單純看看狀態。</p>
      <dl class="kv">
        <dt>誰能用</dt><dd>要登入（Bearer token）；不同角色可能只能查自己權限內的知識</dd>
        <dt>你送什麼</dt><dd><code>{"query":"年假怎麼算？","top_k":20,"rerank":true}</code>＝問題文字＋要抓幾筆＋要不要重排</dd>
        <dt>成功時</dt><dd>回答案、引用出處、信心高低、用量（方便對帳）</dd>
        <dt>失敗例子</dt><dd>422：問題空白或太長；429：問太快被限流；401：Key／登入無效</dd>
        <dt>教學重點</dt><dd>寫進 SPEC 時要附「範例請求／範例成功回覆／常見錯誤」，Codex 才知道畫面要接什麼欄位、失敗要顯示什麼。</dd>
      </dl>
      <pre class="code-block">{
  "answer": "到職滿一年特休 7 天…",
  "citations": [{"chunk_id":"leave-001","quote":"到職滿一年：特休 7 天"}],
  "confidence": "high"
}</pre>`,
  },
  ingest: {
    title: "PUT /v1/kb/documents｜入庫（寫入向量索引）",
      html: `
      <p class="api-plain"><strong>白話：</strong>這是「把法令 Markdown 切開、轉成向量、寫進向量索引」的窗口。沒有這個，問答系統就沒段落可撈。</p>
      <p class="api-plain"><strong>廚房在做什麼？</strong>收到檔案後：切開段落 → 做成 Embedding 向量 → 寫入向量索引（之後就能依意思檢索）。</p>
      <dl class="kv">
        <dt>誰能用</dt><dd>編輯者角色（不是人人都能改知識庫）</dd>
        <dt>你送什麼</dt><dd>檔案（markdown）＋標籤／版本／負責人等 metadata</dd>
        <dt>成功時</dt><dd>回傳文件 id、切了幾塊、版本號</dd>
        <dt>教學重點</dt><dd>一定要寫清「更新是覆蓋舊文，還是新舊版本並存」。寫不清，知識庫會留下幽靈舊規定，答案就會亂。</dd>
      </dl>`,
  },
  health: {
    title: "GET /v1/health｜健康檢查",
    html: `
      <p class="api-plain"><strong>白話：</strong>上課或上線前先問一聲：「廚房開了沒？」模型、向量索引（檢索用）、重排器是否都活著。</p>
      <p class="api-plain"><strong>為什麼重要？</strong>若 AI 掛了還讓使用者一直提問，只會得到錯誤或空白，體驗很差。前端可先打這支，掛了就顯示「維護中」。</p>
      <dl class="kv">
        <dt>成功</dt><dd><code>{"llm":"ok","vector":"ok","reranker":"ok"}</code></dd>
        <dt>失敗</dt><dd>503：任一關鍵服務掛掉</dd>
        <dt>教學重點</dt><dd>SPEC 裡寫「依賴檢查」與前端對應畫面，比等使用者回報「不能用了」更專業。設定頁「測試連線」也可打這支。</dd>
      </dl>`,
  },
};

const PARAMS = [
  {
    name: "Chunk Size",
    range: "1200～1800 tokens",
    suggest: "建議先用 1500 tokens",
    explain:
      "太大：一塊混太多主題，檢索變糊。太小：句子被切斷、上下文碎。中文規章／法規段落建議先用 1500，較能一次裝完整小節。",
    slider: { min: 500, max: 3000, step: 100, value: 1500, unit: "tokens", noteLow: "過碎，引用不完整", noteHigh: "過雜，容易夾帶無關句" },
  },
  {
    name: "Chunk Overlap",
    range: "80～120 tokens",
    suggest: "建議 100 tokens",
    explain:
      "重疊讓跨段落的句子不會在切點斷掉。約為 Chunk Size 的 15%～20% 是常見起點。",
    slider: { min: 0, max: 200, step: 10, value: 100, unit: "tokens", noteLow: "邊界句子易斷", noteHigh: "重複過多，浪費額度" },
  },
  {
    name: "Vector Search Top-K",
    range: "15～20",
    suggest: "建議先設 20",
    explain:
      "先寬抓候選，再交給 Reranker。若關掉重排，Top-K 不宜太大，否則噪音進 context。",
    slider: { min: 5, max: 40, step: 1, value: 20, unit: "", noteLow: "可能漏相關段落", noteHigh: "噪音多，依賴重排消化" },
  },
  {
    name: "Reranker",
    range: "開啟",
    suggest: "強烈建議開啟",
    explain:
      "向量相似≠問句最相關。Reranker 用交叉編碼把「真的能回答這個問題」的段落排前面，是品質關鍵開關。",
    slider: null,
  },
  {
    name: "Reranker 後 Top-K",
    range: "5～8",
    suggest: "建議留下 6",
    explain:
      "最終塞進 Prompt／Context 的段落數。太少會缺資訊，太多會塞爆 Context 並推高成本。查核問答從 6 開始。",
    slider: { min: 3, max: 12, step: 1, value: 6, unit: "", noteLow: "資訊不足", noteHigh: "context 臃腫" },
  },
  {
    name: "Temperature",
    range: "0.1～0.2",
    suggest: "建議 0.15",
    explain:
      "規章查核要穩定、可重現。溫度愈高愈會發揮，也愈容易加油添醋。創意寫作才需要拉高。",
    slider: { min: 0, max: 1, step: 0.05, value: 0.15, unit: "", noteLow: "很穩、略死板", noteHigh: "活潑但易幻覺／亂掰（Hallucination）" },
  },
  {
    name: "Context Length",
    range: "16K～32K",
    suggest: "建議 32K",
    explain:
      "要裝得下：系統提示 + 檢索段落 + 對話歷史 + 輸出預算。32K 對多段落引用較從容；仍要靠 Top-K 控量。",
    slider: null,
  },
  {
    name: "Max Output",
    range: "2K～9K tokens",
    suggest: "一般查核問答建議 3K，複雜查核問答可以 9K",
    explain:
      "一般查核問答用 3K 通常夠寫步驟與引用。遇到較長實務論述、多段依據時可拉到 9K；設太高會拉長等待與成本，真正超長文仍建議拆任務。",
    slider: { min: 500, max: 9000, step: 500, value: 3000, unit: "tokens", noteLow: "答案易被截斷", noteHigh: "延遲與成本上升" },
  },
  {
    name: "相似度門檻",
    range: "視 embedding 模型調整",
    suggest: "不建議直接固定死",
    explain:
      "不同模型的分數尺度不同。先蒐集黃金問題的分數分布，再訂「低於 X 就澄清/拒答」。用相對排名 + 人工抽樣校準。",
    slider: null,
  },
];

const PRESET = [
  ["Chunk Size", "1500"],
  ["Chunk Overlap", "100"],
  ["Vector Top-K", "20"],
  ["Reranker", "ON"],
  ["Rerank Top-K", "6"],
  ["Temperature", "0.15"],
  ["Context", "32K"],
  ["Max Output", "3K／複雜 9K"],
  ["相似度門檻", "依模型校準"],
];

const KB_MAP = {
  oecd: "OECD TPG 2022 與移轉訂價基礎教材：依章節／主題拆 Markdown，保留條號與定義，方便引用「第 X 章／6.32」。",
  tw: "《營利事業所得稅不合常規移轉訂價查核準則》：一點一檔或一條一塊，metadata 標版本與生效日。",
  tier3: "三層文據（CbCR／集團主檔／TP 報告）疑義問答：Q&A 型 Markdown，標題＝問題、內文＝結論＋依據。",
  bapa: "MAP／BAPA 作業要點：流程步驟清單化，利於回答「申請要注意什麼」。",
  beps: "BEPS／MLI／Pillar：國際動態與國內銜接分開檔，避免檢索時主題混雜。",
};

const TERM_GLOSSARY = {
  embedding: {
    title: "Embedding（嵌入／向量化）",
    metaphor: "比喻：把每段文字變成「語意地圖上的座標」",
    body: "想像每份文件、每個段落都被標成地圖上的一個點。意思相近的內容，座標會比較靠近。這樣電腦才能用「距離遠近」做向量檢索，而不是只比對有沒有相同的字。",
  },
  "vector-search": {
    title: "Vector Search（向量檢索）",
    metaphor: "比喻：在向量索引地圖上找「味道相近」的段落",
    body: "你問一句話後，系統先把問題做成 Embedding 座標，再到<strong>向量索引</strong>（存段落向量、方便依意思找）裡找「離你最近」的那些段落。它找的是意思接近，不只是關鍵字完全一樣。",
  },
  topk: {
    title: "Top-K",
    metaphor: "比喻：圖書館先抱回最相關的前 K 本",
    body: "向量檢索可能找到很多「好像有關」的段落。Top-K 就是先只拿前 K 筆（例如 20 筆）進下一關，避免一次抱整座知識庫過來。",
  },
  reranker: {
    title: "Reranker（重排器）",
    metaphor: "比喻：先大量撈書，再請專員精準挑出最該讀的幾本",
    body: "Top-K 先寬抓，Reranker 再用更仔細的標準重新排序，把真正能回答這題的段落排前面，通常再留下大約 5～8 段給語言模型看。",
  },
  chunks: {
    title: "retrieved_chunks（找回來的知識片段）",
    metaphor: "比喻：考試時允許帶進考場的「重點紙條」",
    body: "經過向量檢索與重排後，真正塞進 Prompt／Context 給語言模型看的那幾段資料就叫 retrieved_chunks。模型原則上只能根據這些紙條作答，比較不容易幻覺／亂答。",
  },
  prompt: {
    title: "Prompt（提示詞）",
    metaphor: "比喻：給廚師的「烹飪說明書」",
    body: "不只告訴語言模型要做什麼菜，還規定：只能用這些食材、衝突要講出來、找不到就別亂猜、一定要標出引用。Prompt 就是工作規則。",
  },
  citation: {
    title: "Citation／citations（引用）",
    metaphor: "比喻：寫報告時的「出處腳註」",
    body: "告訴使用者：這句答案是根據知識庫哪一段來的。方便你點回去核對，也比較敢相信。",
  },
  confidence: {
    title: "Confidence（信心程度）",
    metaphor: "比喻：氣象預報說「降雨機率」",
    body: "系統自評這次答案有多有把握。高信心代表依據夠；低信心代表資料不足或不確定，這時更該人工再看一眼。",
  },
  followup: {
    title: "Follow-up（後續建議）",
    metaphor: "比喻：醫生看完說「下次再回診要帶什麼」",
    body: "告訴使用者接下來可以做什麼：補資料、改問法、找誰確認。不是結束對話，而是給你下一步。",
  },
  answer: {
    title: "answer（答案）",
    metaphor: "比喻：考卷上的「正式作答欄」",
    body: "給使用者看的人話回覆。理想上它應該建立在 retrieved_chunks 之上，而不是憑空創作。",
  },
  api: {
    title: "API",
    metaphor: "比喻：餐廳服務生",
    body: "你不會自己跑進廚房炒菜；你跟服務生點餐，服務生再去跟廚房（AI 模型或資料庫）溝通，最後把菜端回來。API 就是程式之間傳話、叫服務的窗口。",
  },
  rag: {
    title: "RAG（檢索增強生成）",
    metaphor: "比喻：先翻筆記再寫作文，而不是全靠背",
    body: "Retrieval（先找回相關資料）+ Augmented（把資料加進提示）+ Generation（再生成答案）。重點是：AI 先看書再答，比較不容易亂掰。",
  },
  hook: {
    title: "Hook（鉤子／事件攔截）",
    metaphor: "比喻：門口保全——進出前先檢查證件",
    body: "某件事發生之前或之後，自動跑一段檢查或後續動作。例如：危險指令先問人、改完檔自動排版、送出前提醒不要貼金鑰。",
  },
  mcp: {
    title: "MCP",
    metaphor: "比喻：萬能轉接頭，讓 Agent（可呼叫工具的 AI）接到外面的工具",
    body: "Model Context Protocol。沒有它，模型多半只能看你貼的文字；有了它，Agent 可以在你允許的範圍內查瀏覽器、資料庫或內部系統。",
  },
  subagent: {
    title: "Subagent（子代理）",
    metaphor: "比喻：專案經理派出「去搜檔」「去跑測試」的專員",
    body: "主 Agent 把大任務拆給專責小助理，可平行、可隔離。適合探索程式庫、跑命令、做獨立審查，做完再把結果交回主流程。",
  },
  workflow: {
    title: "Workflow（工作流）",
    metaphor: "比喻：把「這次剛好做成」變成「下次照做也成」",
    body: "先寫人怎麼做，再標哪些步給 AI、哪些留給人，然後用 <strong>SPEC／Skill</strong> 把約定寫清楚，再用 Hook、MCP、Subagent 把它變成可重複執行的路徑。",
  },
  spec: {
    title: "SPEC（規格）",
    metaphor: "比喻：跟廠商簽的「施工合約」",
    body: "寫清楚要做什麼、輸入輸出、驗收標準、明確不做什麼。給人對齊，也給 AI 照著實作。<strong>建議：</strong>先寫白話驗收清單，再補精簡原文；範圍鎖 MVP，排除項一定要寫。",
  },
  skill: {
    title: "Skill（技能／工作手冊）",
    metaphor: "比喻：把「這次怎麼做出來的」寫成單位共用 SOP，下次直接照做",
    body: "Skill 不是再接一條 MCP，而是把<strong>怎麼做這類任務</strong>寫成可重用說明（步驟、規則、該看哪些檔、輸出格式）。之後對話可自動套用，減少每次重講 PROMPT。<br /><br /><strong>建議怎麼做：</strong><br />1. 先用黃金案例跑通一次，記下成功步驟與踩坑。<br />2. 濃縮成短手冊：何時用、必做／禁止、輸出格式長怎樣。<br />3. 放進專案（例如 Codex Skill／規則），讓同事同一條路徑可重複。<br />4. 真正接工具、門禁、分工，仍搭配 Hook／MCP／Subagent——Skill 管「怎麼做」，它們管「怎麼接、怎麼攔、怎麼拆」。",
  },
  "collab-tools": {
    title: "上述工具（Hook／MCP／Subagent）",
    metaphor: "比喻：劇本寫好了，還要有門禁、接線、分工才能上場",
    body: "這裡的「上述工具」指同一頁前面三張卡：<strong>Hook</strong>（事件門禁）、<strong>MCP</strong>（接外部系統）、<strong>Subagent</strong>（專責小助理）。Workflow／Skill 負責可重複的做法；這三者負責執行時的檢查、接線與分工。",
  },
  orchestrator: {
    title: "Orchestrator（編排引擎）",
    metaphor: "比喻：餐廳外場經理——不炒菜，但決定先上什麼、誰做哪一步",
    body: "問答不是「一個函式叫 LLM」就結束。編排引擎負責：收到問題 → 叫檢索模組 → 看分數夠不夠 → 夠就組 Context 再生成，不夠就澄清。各模組可替換，流程邏輯集中在一處。",
  },
  "chatgpt-like": {
    title: "ChatGPT 式對話體驗",
    metaphor: "比喻：像跟一位會翻資料、會說「我不確定」的顧問聊天",
    body: "不是指長得跟 ChatGPT 一樣，而是：多輪對話、語氣自然、有依據、會追問、不會無故硬答。我們用 RAG + 結構化輸出 + 後處理，在「單位專屬知識」上逼近這種體驗。",
  },
  "frontend-stack": {
    title: "前端技術棧",
    metaphor: "比喻：餐廳大廳——客人看得到的菜單、點餐、上菜",
    body: "TP NOTE01 常見組合：React + Vite 做聊天與設定；心智圖元件做法規節點導覽；Tab 切換知識問答／筆記／匯出。前端只負責呈現與送 API，不直接握正式 API Key（正式版走後端代理）。",
  },
  "backend-api": {
    title: "後端 API",
    metaphor: "比喻：廚房出菜口——前端點餐，後端真的去檢索、生成",
    body: "REST 接口如 POST /chat/query（問答）、PUT /kb/documents（入庫）、GET /health（健康檢查）。後端持有編排引擎，串檢索、LLM、後處理，前端不必知道向量索引細節。",
  },
  "embedding-model": {
    title: "Embedding 模型",
    metaphor: "比喻：把每段文字變成地圖座標的「測量儀」",
    body: "入庫與查詢時都要用同一套 Embedding 模型，段落與問題才在同一座標系。換模型通常要重建索引。常見：OpenAI text-embedding-3、BGE、E5 等。",
  },
  "vector-db": {
    title: "向量索引／Vector DB",
    metaphor: "比喻：依「意思遠近」排好的卡片櫃",
    body: "存每個 chunk 的向量與 metadata（來源檔、章節、版本）。查詢時算距離取 Top-K。可本機 Chroma、SQLite+向量擴充，或 pgvector、Milvus 等。TP NOTE01 偏本機、單位內網部署。",
  },
  "llm-api": {
    title: "LLM API（語言模型接口）",
    metaphor: "比喻：主廚——看食譜（Prompt）與食材（chunks）下菜",
    body: "OpenAI 相容 chat/completions 最常見；亦可 Azure OpenAI、Anthropic、或單位 LLM 閘道。參數：model、temperature、max_tokens。查核場景 temperature 宜低（約 0.15）。",
  },
  "markdown-kb": {
    title: "Markdown 知識庫",
    metaphor: "比喻：切好、貼好標籤的食材庫",
    body: "法規與教材以 Markdown 維護：標題＝主題、metadata＝版本／章節。比 PDF 裸貼更好切塊與引用。入庫前先做知識庫地圖（OECD、台灣準則、BAPA…分檔）。",
  },
  ingest: {
    title: "Ingest（入庫管線）",
    metaphor: "比喻：進貨驗收——切塊、貼標、上架",
    body: "文件 → 依 Chunk Size／Overlap 切塊 → Embedding → 寫入向量索引。SPEC 要寫清：更新是覆蓋還是版本並存，避免幽靈舊規定。",
  },
  "hybrid-search": {
    title: "Hybrid Search（混合檢索）",
    metaphor: "比喻：既看「意思像不像」，也搜「關鍵字有沒有命中」",
    body: "純向量有時漏掉精確條號（如「第 14 點」）。混合檢索 = 向量 + BM25／關鍵字，再合併去重。法規查核常需要這層保險。",
  },
  "context-assembler": {
    title: "Context 組裝",
    metaphor: "比喻：把要帶進考場的紙條排好，而且不能超過紙張上限",
    body: "把 Rerank 後的 6 段 + 系統 Prompt + 對話摘要，塞進 Context 長度預算（Token budget）。太長就截斷或摘要，避免爆 context、拉高成本。",
  },
  "post-process": {
    title: "Post-process（後處理）",
    metaphor: "比喻：出菜前的品管——對照食譜、貼來源標籤",
    body: "解析模型輸出：對照 chunk_id、產生 citations、算 confidence、格式不符則重試或降級。低信心觸發澄清 UI，而不是直接顯示看似完整的錯答案。",
  },
  "golden-questions": {
    title: "黃金題（Golden Questions）",
    metaphor: "比喻：期末考考古題——用固定題目驗收有沒有真的學會",
    body: "TP NOTE01 例：避風港、BAPA 申請、可比較利潤法。每題預期要引用的段落。調 Chunk、Prompt、Top-K 後用同一套黃金題回歸，才客觀知道有沒有變好。",
  },
  streaming: {
    title: "Streaming（串流輸出）",
    metaphor: "比喻：邊炒邊上菜——不用等整桌做完才端出來",
    body: "LLM 逐 token 回傳，UI 逐字顯示，體感更像 ChatGPT。編排引擎仍可在串流結束後跑後處理（引用、信心）。",
  },
  "rule-engine": {
    title: "Rule Engine（規則引擎）",
    metaphor: "比喻：先查法規電腦系統，再請顧問用白話解釋",
    body: "像 treaty_rate_ai：稅率、適用要件由結構化 Rule DB 決定，LLM 只負責說明與論述，不能自己「發明」稅率。這是專業查核系統和一般聊天機器人的關鍵差異。",
  },
  "tp-lego": {
    title: "tp_lego（TP 積木子引擎）",
    metaphor: "比喻：依圖紙只拿出需要的積木，不是把整箱倒出來",
    body: "FAR 題用 FAR 積木、可比題用可比積木。tp_reasoning orchestrator 依 question_type 呼叫 tp_sub_engines 裡的不同積木，避免一個 Prompt 包所有規則。",
  },
  "prompt-block": {
    title: "prompt_block",
    metaphor: "比喻：給 LLM 的「已填好欄位的表格」",
    body: "規則引擎跑完後產生的結構化文字塊（爭點、缺失事實、協定結果、引用），塞進 Prompt 讓 LLM 只負責寫自然語言，不負責「想分析架構」。",
  },
};

/* ---------- helpers ---------- */
function $(sel, root = document) {
  return root.querySelector(sel);
}

function $all(sel, root = document) {
  return [...root.querySelectorAll(sel)];
}

function show(el) {
  if (!el) return;
  el.hidden = false;
  el.removeAttribute("hidden");
}

function hide(el) {
  if (!el) return;
  el.hidden = true;
  el.setAttribute("hidden", "");
}

/* ---------- nav ---------- */
const navToggle = $("#navToggle");
const navLinks = $("#navLinks");

navToggle?.addEventListener("click", () => {
  const open = navLinks.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(open));
});

navLinks?.addEventListener("click", (e) => {
  if (e.target.closest("a")) {
    navLinks.classList.remove("open");
    if (deckMode) {
      e.preventDefault();
      const id = e.target.closest("a").getAttribute("href")?.slice(1);
      const idx = SECTIONS.indexOf(id);
      if (idx >= 0) goDeck(idx);
    }
  }
});

/* ---------- path strip + fab ---------- */
$all(".path-node").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    const id = btn.dataset.target;
    if (!id) return; // e.g. external page link
    if (deckMode) {
      e.preventDefault();
      const idx = SECTIONS.indexOf(id);
      if (idx >= 0) goDeck(idx);
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  });
});

const fabNext = $("#fabNext");
fabNext?.addEventListener("click", () => {
  const current = getCurrentSectionIndex();
  const next = Math.min(current + 1, SECTIONS.length - 1);
  document.getElementById(SECTIONS[next])?.scrollIntoView({ behavior: "smooth" });
});

function getCurrentSectionIndex() {
  if (deckMode) return deckIndex;
  const y = window.scrollY + 120;
  let idx = 0;
  SECTIONS.forEach((id, i) => {
    const el = document.getElementById(id);
    if (el && el.offsetTop <= y) idx = i;
  });
  return idx;
}

function updateProgressUI() {
  const idx = getCurrentSectionIndex();
  const progress = (idx / (SECTIONS.length - 1)) * 100;
  const fill = $("#timerFill");
  if (fill) fill.style.width = `${progress}%`;

  $all(".path-node").forEach((n) => {
    n.classList.toggle("active", n.dataset.target === SECTIONS[idx]);
  });

  $all(".nav-links a").forEach((a) => {
    const href = a.getAttribute("href")?.slice(1);
    a.classList.toggle("active", href === SECTIONS[idx]);
  });

  fabNext?.classList.toggle("hide", deckMode || idx >= SECTIONS.length - 1);
  if (fabNext && idx < SECTIONS.length - 1) {
    const label = SECTIONS[idx + 1];
    fabNext.textContent = `下一主題：${SECTION_TITLES[label] || "繼續"} →`;
  }

  const counter = $("#deckCounter");
  if (counter) {
    let text = `${idx + 1} / ${SECTIONS.length}`;
    if (SECTIONS[idx] === "loop") text += ` · ${loopSlideIndex + 1}/${LOOP_SLIDE_COUNT}`;
    counter.textContent = text;
  }
}

window.addEventListener(
  "scroll",
  () => {
    if (!deckMode) updateProgressUI();
  },
  { passive: true }
);

/* ---------- deck / slideshow mode ---------- */
let deckMode = false;
let deckIndex = 0;
let loopSlideIndex = 0;
const LOOP_SLIDE_COUNT = 8;

function enterDeck(startIdx) {
  deckMode = true;
  deckIndex = typeof startIdx === "number" ? startIdx : getCurrentSectionIndex();
  document.body.classList.add("deck-mode");
  document.body.classList.remove("deck-chrome-hidden");
  $("#deckToggle")?.classList.add("active");
  if ($("#deckToggle")) $("#deckToggle").textContent = "離開投影片";
  show($("#deckChrome"));
  hide($("#deckPeek"));
  goDeck(deckIndex);
  try {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    }
  } catch (_) {
    /* ignore — browser may block */
  }
}

function exitDeck() {
  deckMode = false;
  document.body.classList.remove("deck-mode");
  document.body.classList.remove("deck-chrome-hidden");
  $("#deckToggle")?.classList.remove("active");
  if ($("#deckToggle")) $("#deckToggle").textContent = "投影片模式";
  hide($("#deckChrome"));
  hide($("#deckPeek"));
  $all(".section").forEach((s) => s.classList.remove("deck-active"));
  const id = SECTIONS[deckIndex] || "hero";
  document.getElementById(id)?.scrollIntoView({ behavior: "auto" });
  updateProgressUI();
  if (document.fullscreenElement) {
    document.exitFullscreen?.().catch(() => {});
  }
}

function setDeckChromeHidden(hidden) {
  document.body.classList.toggle("deck-chrome-hidden", hidden);
  if (hidden) {
    show($("#deckPeek"));
  } else {
    hide($("#deckPeek"));
  }
}

function toggleDeckChrome() {
  if (!deckMode) return;
  setDeckChromeHidden(!document.body.classList.contains("deck-chrome-hidden"));
}

function goDeck(idx) {
  const prevId = SECTIONS[deckIndex];
  deckIndex = Math.max(0, Math.min(idx, SECTIONS.length - 1));
  if (SECTIONS[deckIndex] === "loop" && prevId !== "loop") {
    const loopIdx = SECTIONS.indexOf("loop");
    const fromAfter = SECTIONS.indexOf(prevId) > loopIdx;
    showLoopSlide(fromAfter ? LOOP_SLIDE_COUNT - 1 : 0);
  }
  $all(".section").forEach((s) => {
    if (!s.hasAttribute("tabindex")) s.setAttribute("tabindex", "-1");
    s.classList.toggle("deck-active", s.id === SECTIONS[deckIndex]);
    if (s.id === SECTIONS[deckIndex]) {
      // Reveal elements that IO / animations may have left hidden
      $all(".glass, .panel, .kb-step, .api-card, .tip-card, .reveal", s).forEach((el) => {
        el.style.opacity = "1";
        el.style.transform = "none";
      });
      $all(".flow-node", s).forEach((el) => {
        el.style.opacity = "1";
      });
      requestAnimationFrame(() => {
        s.scrollTop = 0;
      });
      try {
        s.focus({ preventScroll: true });
      } catch (_) {
        /* ignore */
      }
    }
  });
  updateProgressUI();
}

function toggleDeck() {
  if (deckMode) exitDeck();
  else enterDeck();
}

$("#deckToggle")?.addEventListener("click", toggleDeck);
$("#heroDeck")?.addEventListener("click", () => enterDeck(0));
$("#deckPrev")?.addEventListener("click", () => goDeck(deckIndex - 1));
$("#deckNext")?.addEventListener("click", () => goDeck(deckIndex + 1));
$("#deckExit")?.addEventListener("click", exitDeck);
$("#deckHideChrome")?.addEventListener("click", () => setDeckChromeHidden(true));
$("#deckPeek")?.addEventListener("click", () => setDeckChromeHidden(false));

document.addEventListener("keydown", (e) => {
  const tag = (e.target && e.target.tagName) || "";
  if (tag === "INPUT" || tag === "TEXTAREA") return;

  if (e.key === "Escape" && $("#termModal") && !$("#termModal").hidden) {
    e.preventDefault();
    closeTermModal();
    return;
  }

  if (e.key === "Escape" && aiFlowModal && !aiFlowModal.hidden) {
    e.preventDefault();
    closeAiFlowModal();
    return;
  }

  if (e.key === "Escape" && frameworkDraftModal && !frameworkDraftModal.hidden) {
    e.preventDefault();
    closeFrameworkDraftModal();
    return;
  }

  if (frameworkDraftModal && !frameworkDraftModal.hidden) {
    if (e.key === "ArrowRight" || e.key === " ") {
      e.preventDefault();
      if (frameworkDraftIndex < FRAMEWORK_DRAFTS.length - 1) stepFrameworkDraftSlide(1);
      return;
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (frameworkDraftIndex > 0) stepFrameworkDraftSlide(-1);
      return;
    }
  }

  if (e.key === "Escape" && loopModal && !loopModal.hidden) {
    e.preventDefault();
    closeLoopModal();
    return;
  }

  if (e.key === "p" || e.key === "P") {
    e.preventDefault();
    toggleDeck();
    return;
  }

  if ((e.key === "h" || e.key === "H") && deckMode) {
    e.preventDefault();
    toggleDeckChrome();
    return;
  }

  if (e.key === "f" || e.key === "F") {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    return;
  }

  if (!deckMode) return;

  if (anyModalOpen()) {
    if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " " || e.key === "ArrowLeft" || e.key === "PageUp") {
      e.preventDefault();
    }
    return;
  }

  if (e.key === "Escape") {
    e.preventDefault();
    exitDeck();
  } else if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
    e.preventDefault();
    if (SECTIONS[deckIndex] === "loop" && loopSlideIndex < LOOP_SLIDE_COUNT - 1) {
      showLoopSlide(loopSlideIndex + 1);
      return;
    }
    goDeck(deckIndex + 1);
  } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
    e.preventDefault();
    if (SECTIONS[deckIndex] === "loop" && loopSlideIndex > 0) {
      showLoopSlide(loopSlideIndex - 1);
      return;
    }
    goDeck(deckIndex - 1);
  } else if (e.key === "Home") {
    e.preventDefault();
    goDeck(0);
  } else if (e.key === "End") {
    e.preventDefault();
    goDeck(SECTIONS.length - 1);
  }
});

/* ---------- demo pulse ---------- */
$("#demoPulse")?.addEventListener("click", () => {
  document.body.classList.add("pulse-demo");
  setTimeout(() => document.body.classList.remove("pulse-demo"), 900);
  if (deckMode) {
    goDeck(SECTIONS.indexOf("plan"));
  } else {
    document.getElementById("plan")?.scrollIntoView({ behavior: "smooth" });
  }
  setTimeout(() => {
    $(".panel[data-panel='goal']")?.classList.add("open");
  }, 500);
});

/* ---------- plan panels ---------- */
$all(".panel.interactive").forEach((panel) => {
  panel.querySelector(".panel-trigger")?.addEventListener("click", () => {
    const willOpen = !panel.classList.contains("open");
    $all(".panel.interactive").forEach((p) => p.classList.remove("open"));
    if (willOpen) {
      panel.classList.add("open");
      if (panel.dataset.panel === "scope") showTier("mvp");
    }
  });
});

const TIER_COPY = {
  mvp: {
    title: "MVP · 最小可演示",
    body: "只要能在台上／會議上「跑得起來給人看」就好。功能少、路徑短、先證明方向對。",
    tip: "例如 TP NOTE01：先做到「問一句 TP 問題 → 從知識庫找回段落 → 產出有引用的答案」。登入權限、精美匯出、多語系都可以先不做。",
  },
  v1: {
    title: "V1 · 可給真實用戶",
    body: "給真正的同事／使用者每天用。要更穩、更好懂、有基本錯誤處理與使用說明。",
    tip: "例如：補心智圖導覽、存筆記／匯出、低信心時會反問、常用黃金題測過。還不是「什麼都有」的完整產品。",
  },
  later: {
    title: "Later · 先記下來不現做",
    body: "很想要、但這次不做。寫進清單就好，避免跟 AI 東加西加把範圍扯爆。",
    tip: "例如：自動對多國稅制、完整審核工作流、行動 App、與其他系統深度串接——先記在 Later，等 MVP／V1 站穩再排。",
  },
};

function showTier(key) {
  const data = TIER_COPY[key];
  if (!data) return;
  $all(".tier-btn").forEach((b) => b.classList.toggle("active", b.dataset.tier === key));
  const box = $("#tierExplain");
  if (!box) return;
  box.innerHTML = `<h5>${data.title}</h5><p>${data.body}</p><p class="ex">${data.tip}</p>`;
}

$all(".tier-btn").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    showTier(btn.dataset.tier);
  });
});

const liveSentence = $("#liveSentence");
$all("#planForm input").forEach((input) => {
  input.addEventListener("input", () => {
    const who = $('[data-field="who"]').value || "〔誰〕";
    const when = $('[data-field="when"]').value || "〔情境〕";
    const what = $('[data-field="what"]').value || "〔結果〕";
    liveSentence.textContent = `幫「${who}」在「${when}」完成「${what}」。`;
  });
});

/* ---------- flow ---------- */
const flowDetail = $("#flowDetail");
$all(".flow-node").forEach((node) => {
  node.addEventListener("click", () => {
    const key = node.dataset.flow;
    const data = FLOW_COPY[key];
    if (!data) return;
    $all(".flow-node").forEach((n) => n.classList.remove("active"));
    node.classList.add("active");
    $("#flowDetailTitle").textContent = data.title;
    $("#flowDetailBody").textContent = data.body;
    $("#flowDetailTip").textContent = data.tip;
    show(flowDetail);
  });
});

flowDetail?.querySelector(".close-detail")?.addEventListener("click", () => {
  hide(flowDetail);
  $all(".flow-node").forEach((n) => n.classList.remove("active"));
});

/* ---------- tip: 給 AI 看 modal ---------- */
const aiFlowModal = $("#aiFlowModal");
const termModal = $("#termModal");
const loopModal = $("#loopModal");
const frameworkDraftModal = $("#frameworkDraftModal");

function anyModalOpen() {
  return [termModal, aiFlowModal, loopModal, frameworkDraftModal].some((m) => m && !m.hidden);
}

function openAiFlowModal() {
  show(aiFlowModal);
  document.body.classList.add("modal-open");
}

function closeAiFlowModal() {
  hide(aiFlowModal);
  if (!anyModalOpen()) document.body.classList.remove("modal-open");
}

function openTermModal(termKey) {
  const data = TERM_GLOSSARY[termKey];
  const modal = $("#termModal");
  if (!data || !modal) return;
  const title = $("#termModalTitle");
  const metaphor = $("#termModalMetaphor");
  const body = $("#termModalBody");
  if (title) title.textContent = data.title;
  if (metaphor) metaphor.textContent = data.metaphor;
  if (body) body.innerHTML = data.body;
  show(modal);
  document.body.classList.add("modal-open");
}

function closeTermModal() {
  hide($("#termModal"));
  if (!anyModalOpen()) document.body.classList.remove("modal-open");
}

$("#tipAiReadable")?.addEventListener("click", openAiFlowModal);
$("#aiFlowModalClose")?.addEventListener("click", closeAiFlowModal);
aiFlowModal?.addEventListener("click", (e) => {
  if (e.target === aiFlowModal) closeAiFlowModal();
});

$("#termModalClose")?.addEventListener("click", closeTermModal);
$("#termModal")?.addEventListener("click", (e) => {
  if (e.target === $("#termModal")) closeTermModal();
});

function openFrameworkDraftModal() {
  setFrameworkDraftSlide(0);
  show(frameworkDraftModal);
  document.body.classList.add("modal-open");
}

function closeFrameworkDraftModal() {
  hide(frameworkDraftModal);
  if (!anyModalOpen()) document.body.classList.remove("modal-open");
}

const FRAMEWORK_DRAFTS = [
  {
    title: "當初設計框架草稿",
    lead:
      "紙上初稿：優化 Prompt + RAG(MD) + 31B → Thought／Reasoning／Writing + Validation；下方五區塊（法令、翻譯、去識別化、會議助手、筆記本）與助手模式／專業問答管線。",
    src: "assets/images/framework-draft.jpg",
    alt: "當初設計框架手繪草稿：31B 三模型、五區塊與 RAG 管線",
    nextLabel: "還有一張，翻過去看看",
  },
  {
    title: "Thought Model 草稿",
    lead:
      "思考層流程：原始輸入 → 真正意圖 → 核心問題 → 調用哪些模組／engine → 主要／次要觀點 → 是否過度依賴 RAG → Validation 六步（案件理解、問題辨識、查核假說、案例比對 → Reasoning Model → Writing Model）。",
    src: "assets/images/thought-model-draft.jpg",
    alt: "Thought Model 手繪草稿：意圖解析、RAG 依賴檢查與 Validation 管線",
    nextLabel: "",
  },
];

let frameworkDraftIndex = 0;

function setFrameworkDraftSlide(index) {
  const total = FRAMEWORK_DRAFTS.length;
  frameworkDraftIndex = Math.max(0, Math.min(index, total - 1));
  const slide = FRAMEWORK_DRAFTS[frameworkDraftIndex];
  const titleEl = $("#frameworkDraftTitle");
  const leadEl = $("#frameworkDraftLead");
  const imgEl = $("#frameworkDraftImg");
  const prevBtn = $("#frameworkDraftPrev");
  const nextBtn = $("#frameworkDraftNext");
  const dotsEl = $("#frameworkDraftDots");

  if (titleEl) titleEl.textContent = slide.title;
  if (leadEl) leadEl.textContent = slide.lead;
  if (imgEl) {
    imgEl.src = slide.src;
    imgEl.alt = slide.alt;
  }
  if (prevBtn) prevBtn.hidden = frameworkDraftIndex === 0;
  if (nextBtn) {
    nextBtn.hidden = frameworkDraftIndex >= total - 1;
    const label = nextBtn.querySelector(".draft-arrow-label");
    if (label) label.textContent = slide.nextLabel || "下一張";
  }
  if (dotsEl) {
    dotsEl.querySelectorAll("span").forEach((dot, i) => {
      dot.classList.toggle("active", i === frameworkDraftIndex);
    });
  }
}

function stepFrameworkDraftSlide(delta) {
  setFrameworkDraftSlide(frameworkDraftIndex + delta);
}

$("#openFrameworkDraft")?.addEventListener("click", openFrameworkDraftModal);
$("#frameworkDraftClose")?.addEventListener("click", closeFrameworkDraftModal);
$("#frameworkDraftPrev")?.addEventListener("click", () => stepFrameworkDraftSlide(-1));
$("#frameworkDraftNext")?.addEventListener("click", () => stepFrameworkDraftSlide(1));
frameworkDraftModal?.addEventListener("click", (e) => {
  if (e.target === frameworkDraftModal) closeFrameworkDraftModal();
});

// Event delegation so all term buttons work (incl. after deck / dynamic UI)
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".term-btn");
  if (!btn) return;
  e.preventDefault();
  e.stopPropagation();
  openTermModal(btn.getAttribute("data-term"));
});

/* ---------- tabs helper ---------- */
function bindTabs(rootSel) {
  const root = $(rootSel);
  if (!root) return;
  $all("[role='tab']", root).forEach((tab) => {
    tab.addEventListener("click", () => {
      const name = tab.dataset.tab;
      $all("[role='tab']", root).forEach((t) => t.setAttribute("aria-selected", String(t === tab)));
      $all(".tab-panel", root).forEach((p) => p.classList.toggle("active", p.dataset.panel === name));
    });
  });
}

bindTabs("#specTabs");
bindTabs("#caseTabs");
bindTabs("#caseTabsComparable");
bindTabs("#kbTabs");

/* ---------- case switcher ---------- */
function showCase(caseId) {
  const id = caseId === "comparable" ? "comparable" : "note01";
  $all(".case-switch-btn").forEach((btn) => {
    const on = btn.dataset.case === id;
    btn.classList.toggle("active", on);
    btn.setAttribute("aria-selected", String(on));
  });
  $all("[data-case-view]").forEach((view) => {
    const on = view.dataset.caseView === id;
    view.classList.toggle("active", on);
    view.hidden = !on;
  });
}

$all(".case-switch-btn").forEach((btn) => {
  btn.addEventListener("click", () => showCase(btn.dataset.case));
});

$all("[data-case-jump]").forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    showCase(link.dataset.caseJump);
    if (deckMode) goDeck(SECTIONS.indexOf("case"));
    else document.getElementById("case")?.scrollIntoView({ behavior: "smooth" });
  });
});

/* ---------- prompt layers ---------- */
const selectedLayers = new Set();
const promptOut = $("#promptOut");
const promptPlaceholder = $(".prompt-placeholder");

$all(".layer-chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    const key = chip.dataset.layer;
    if (selectedLayers.has(key)) {
      selectedLayers.delete(key);
      chip.classList.remove("on");
    } else {
      selectedLayers.add(key);
      chip.classList.add("on");
    }
    renderPrompt();
  });
});

function renderPrompt() {
  const order = ["role", "task", "context", "format", "rules"];
  const parts = order.filter((k) => selectedLayers.has(k)).map((k) => PROMPT_LAYERS[k]);
  if (!parts.length) {
    hide(promptOut);
    show(promptPlaceholder);
    return;
  }
  promptOut.textContent = parts.join("\n\n");
  show(promptOut);
  hide(promptPlaceholder);
}

/* ---------- api ---------- */
const apiInspector = $("#apiInspector");
$all(".api-card").forEach((card) => {
  card.addEventListener("click", () => {
    const key = card.dataset.api;
    const data = API_COPY[key];
    if (!data) return;
    $all(".api-card").forEach((c) => c.classList.remove("active"));
    card.classList.add("active");
    $("#apiInspectorBody").innerHTML = `<h3>${data.title}</h3>${data.html}`;
    show(apiInspector);
  });
});

apiInspector?.querySelector(".close-detail")?.addEventListener("click", () => {
  hide(apiInspector);
  $all(".api-card").forEach((c) => c.classList.remove("active"));
});

/* ---------- kb ---------- */
$all(".kb-step").forEach((step) => {
  step.addEventListener("click", () => {
    $all(".kb-step").forEach((s) => s.classList.remove("active"));
    step.classList.add("active");
  });
});

$("#toggleMdView")?.addEventListener("click", () => {
  const src = $("#mdSource");
  const preview = $("#mdPreview");
  const showingPreview = !preview.hidden;
  preview.hidden = showingPreview;
  src.hidden = !showingPreview;
});

/* ---------- case kb map ---------- */
$all(".kb-map-node").forEach((btn) => {
  btn.addEventListener("click", () => {
    $all(".kb-map-node").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    const detail = $("#kbMapDetail");
    if (detail) detail.innerHTML = `<p>${KB_MAP[btn.dataset.kb] || ""}</p>`;
  });
});

/* ---------- params table ---------- */
const tbody = $("#paramsTable tbody");
const paramDetail = $("#paramDetail");

PARAMS.forEach((p, i) => {
  const tr = document.createElement("tr");
  tr.dataset.index = String(i);
  tr.innerHTML = `
    <td class="name">${p.name}</td>
    <td class="suggest">${p.range}</td>
    <td class="desc">${p.suggest}</td>
    <td class="chev">›</td>
  `;
  tr.addEventListener("click", () => openParam(i));
  tbody.appendChild(tr);
});

function openParam(i) {
  const p = PARAMS[i];
  $all("#paramsTable tbody tr").forEach((tr) => tr.classList.toggle("active", Number(tr.dataset.index) === i));
  $("#paramTitle").textContent = p.name;
  $("#paramSuggest").textContent = `${p.range} · ${p.suggest}`;
  $("#paramExplain").textContent = p.explain;

  const wrap = $("#paramSliderWrap");
  if (p.slider) {
    show(wrap);
    const s = p.slider;
    const slider = $("#paramSlider");
    slider.min = s.min;
    slider.max = s.max;
    slider.step = s.step;
    slider.value = s.value;
    $("#sliderLabel").textContent = p.name;
    updateSliderNote(p);
    slider.oninput = () => updateSliderNote(p);
  } else {
    hide(wrap);
  }
  show(paramDetail);
  if (deckMode) {
    requestAnimationFrame(() => {
      paramDetail.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }
}

function updateSliderNote(p) {
  const s = p.slider;
  const slider = $("#paramSlider");
  const val = Number(slider.value);
  $("#sliderValue").textContent = s.unit ? `${val} ${s.unit}` : String(val);
  const mid = (s.min + s.max) / 2;
  const note =
    val < mid - (s.max - s.min) * 0.15
      ? s.noteLow
      : val > mid + (s.max - s.min) * 0.15
        ? s.noteHigh
        : "落在建議舒適區附近";
  $("#sliderNote").textContent = note;
}

paramDetail?.querySelector(".close-detail")?.addEventListener("click", () => {
  hide(paramDetail);
  $all("#paramsTable tbody tr").forEach((tr) => tr.classList.remove("active"));
});

$("#applyPreset")?.addEventListener("click", () => {
  const list = $("#presetList");
  list.innerHTML = PRESET.map(([k, v]) => `<li><strong>${k}</strong>${v}</li>`).join("");
  list.classList.remove("shown");
  void list.offsetWidth;
  list.classList.add("shown");
});

/* ---------- kb: chunk / inspect / qualify / copy ---------- */
const CHUNK_MODES = {
  good: {
    html: `
      <article class="chunk-piece glass-lite" data-chunk="a">
        <header><span class="chunk-id">chunk A</span><strong># 年假</strong></header>
        <ul>
          <li>到職滿一年：特休 7 天</li>
          <li>申請需提前 3 個工作日</li>
        </ul>
      </article>
      <div class="chunk-cut">──── 依 H1 切點 · overlap 只重疊邊界句 ────</div>
      <article class="chunk-piece glass-lite" data-chunk="b">
        <header><span class="chunk-id">chunk B</span><strong># 病假</strong></header>
        <ul>
          <li>需附證明（連續 2 天以上）</li>
          <li>當年度上限依勞基法</li>
        </ul>
      </article>`,
    note: "年假規則完整在 A、病假完整在 B。問「年假要提前幾天申請？」能整段引用。",
  },
  bad: {
    html: `
      <article class="chunk-piece glass-lite bad" data-chunk="a">
        <header><span class="chunk-id">chunk A · 壞</span><strong>硬切 80 字</strong></header>
        <ul>
          <li>到職滿一年：特休 7 天</li>
        </ul>
      </article>
      <div class="chunk-cut warn">──── 字數到了就切 · 「提前 3 日」掉到下塊 ────</div>
      <article class="chunk-piece glass-lite bad" data-chunk="b">
        <header><span class="chunk-id">chunk B · 壞</span><strong>主題混在一起</strong></header>
        <ul>
          <li>申請需提前 3 個工作日</li>
          <li>需附證明（連續 2 天以上）</li>
          <li>當年度上限依勞基法</li>
        </ul>
      </article>`,
    note: "問「年假要提前申請嗎？」可能命中病假塊，或引用不完整。這就是切太碎＋主題混塊。",
  },
};

function showChunkMode(mode) {
  const data = CHUNK_MODES[mode] || CHUNK_MODES.good;
  $all(".chunk-mode-btn").forEach((b) => b.classList.toggle("active", b.dataset.chunkMode === mode));
  const viz = $("#chunkViz");
  const note = $("#chunkNote");
  if (viz) viz.innerHTML = data.html;
  if (note) note.textContent = data.note;
}

$all(".chunk-mode-btn").forEach((btn) => {
  btn.addEventListener("click", () => showChunkMode(btn.dataset.chunkMode));
});

const FAIL_COPY = {
  碎: "症狀：一句規則被切成兩塊，引用缺半句。改法：依標題切，必要時加大 Chunk Size；原則與例外同塊。",
  雜: "症狀：一塊混兩個主題，檢索變糊。改法：一檔一事、一節一意；不要為了湊滿 Chunk Size 硬塞。",
  題: "症狀：標題太詩意或太籠統，問句對不到。改法：標題寫成人會搜的話，例如「年假申請期限」而不是「注意事項」。",
  meta: "症狀：新舊版搶命中、權限不清。改法：YAML 補 version / 生效日 / owner；舊版標過期或下架。",
  混: "症狀：請假、報銷、資安塞同一檔。改法：拆檔；檔名用主題，不要叫「完整彙整」。",
  舊: "症狀：答到已廢止條文。改法：生效日＋下架流程；入庫前先對版本。",
  超: "症狀：知識庫本來就沒這題，卻硬答。改法：這不是切塊問題——PROMPT 要低信心拒答或澄清。",
};

$all(".fail-chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    $all(".fail-chip").forEach((c) => c.classList.toggle("active", c === chip));
    const box = $("#failDetail");
    if (box) box.innerHTML = `<p>${FAIL_COPY[chip.dataset.fail] || ""}</p>`;
  });
});

function updateQualifyScore() {
  const items = $all(".qualify-check");
  const on = items.filter((b) => b.getAttribute("aria-pressed") === "true").length;
  const score = $("#qualifyScore");
  if (score) score.textContent = `${on} / ${items.length} 合格項`;
  score?.classList.toggle("ok", on === items.length && items.length > 0);
}

$all(".qualify-check").forEach((btn) => {
  btn.addEventListener("click", () => {
    const on = btn.getAttribute("aria-pressed") !== "true";
    btn.setAttribute("aria-pressed", String(on));
    btn.closest("li")?.classList.toggle("checked", on);
    updateQualifyScore();
  });
});

document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-copy-target]");
  if (!btn) return;
  const el = document.getElementById(btn.dataset.copyTarget);
  if (!el) return;
  const text = el.innerText.trim();
  navigator.clipboard?.writeText(text).then(
    () => {
      const prev = btn.textContent;
      btn.textContent = "已複製";
      btn.classList.add("copied");
      setTimeout(() => {
        btn.textContent = prev;
        btn.classList.remove("copied");
      }, 1400);
    },
    () => {
      btn.textContent = "請手動複製";
    }
  );
});

/* ---------- collab: hook / mcp / subagent / workflow ---------- */
const TOOL_COPY = {
  hook: {
    title: "Hook（鉤子／事件攔截）",
    metaphor: "比喻：門口保全——Agent 要出門或進門前，先檢查證件。",
    body: "Hook 是「某件事發生之前或之後，自動跑一段檢查或後續動作」。不是讓人每次盯著看，而是把規則寫進事件裡。",
    items: ["改完檔自動格式化", "危險指令（刪檔、對外連網）先問人", "送出前提醒：不要貼金鑰、個資", "Subagent 結束後，自動接下一棒"],
  },
  mcp: {
    title: "MCP（Model Context Protocol）",
    metaphor: "比喻：萬能轉接頭——讓 Agent（可呼叫工具的 AI）接到瀏覽器、資料庫、內部系統。",
    body: "沒有 MCP，模型多半只能看你貼上的文字。有了 MCP，Agent 能在你允許的範圍內「自己去查、去呼叫被核准的工具」。",
    items: ["接瀏覽器看頁面、點按鈕", "接內部資料庫或 API（需權限）", "接專案裡已設定好的服務", "重點：能做什麼，由你安裝與授權決定"],
  },
  subagent: {
    title: "Subagent（子代理）",
    metaphor: "比喻：專案經理派出「去搜檔」「去跑測試」的專員。",
    body: "主 Agent 把大任務拆給專責小助理，可平行、可隔離。做完把結果交回主流程，避免一件事把 Context 塞爆。",
    items: ["探索程式庫、找檔（explore）", "專心跑命令（shell）", "獨立做審查或實驗", "適合：任務大、要平行、要隔離副作用"],
  },
  workflow: {
    title: "Workflow（工作流）",
    metaphor: "比喻：把「這次剛好做成」變成「下次照做也成」的劇本。",
    body: "Workflow 不是另一個神奇按鈕，而是把人的步驟、AI 的步驟、門禁與工具，寫成可重複執行的路徑。",
    items: ["先寫 5～9 步現況流程", "標哪些步 AI 做、哪些人做", "知識庫用 Markdown；約定寫成 SPEC／Skill", "門禁用 Hook；外部系統用 MCP；分工用 Subagent"],
  },
};

function showTool(key) {
  const data = TOOL_COPY[key];
  if (!data) return;
  $all(".tool-card").forEach((c) => c.classList.toggle("active", c.dataset.tool === key));
  const metaphor = $("#toolMetaphor");
  const title = $("#toolTitle");
  const body = $("#toolBody");
  const list = $("#toolList");
  if (metaphor) metaphor.textContent = data.metaphor;
  if (title) title.textContent = data.title;
  if (body) body.textContent = data.body;
  if (list) list.innerHTML = data.items.map((t) => `<li>${t}</li>`).join("");
  const detail = $("#toolDetail");
  if (deckMode && detail) {
    requestAnimationFrame(() => {
      detail.scrollTop = 0;
      detail.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }
}

$all(".tool-card").forEach((card) => {
  card.addEventListener("click", () => showTool(card.dataset.tool));
});

const WF_COPY = {
  1: { title: "1 · 寫出現況", body: "把現在人工怎麼做寫成 5～9 步。不要一開始就想自動化，先對齊「真正的路徑」。" },
  2: { title: "2 · 標人／AI", body: "每一步標：AI 做、人做、或 AI 草稿＋人核准。不確定、高風險、要簽字的，留給人。" },
  3: { title: "3 · 寫成 SPEC／Skill", body: "輸入、輸出、例外、驗收寫清楚。再濃縮成專案 Skill（可重用工作手冊），讓之後對話自動套用，同事不用每次重講。" },
  4: { title: "4 · 需要外部系統 → MCP", body: "AI 要查網、查庫、叫內部 API，就接 MCP。先列「允許哪些工具」，不要一次全開。" },
  5: { title: "5 · 需要門禁 → Hook", body: "危險命令先問、改檔後檢查、送出前擋機密。Hook 負責「自動執行規則」，不是取代判斷。" },
  6: { title: "6 · 需要分工 → Subagent", body: "搜程式、跑測試、平行調查，派專責子代理。主流程只收結果，避免上下文爆炸。" },
  7: { title: "7 · 跑黃金案例並回饋", body: "用 8～10 題／件真實案例跑一遍。失敗要分類：切塊、參數、PROMPT、還是流程本身。這一步接到下一區「回饋迴路」。" },
};

function showWf(key) {
  const data = WF_COPY[key];
  if (!data) return;
  $all(".wf-step").forEach((s) => s.classList.toggle("active", s.dataset.wf === String(key)));
  const box = $("#wfExplain");
  if (box) box.innerHTML = `<h4>${data.title}</h4><p>${data.body}</p>`;
}

$all(".wf-step").forEach((btn) => {
  btn.addEventListener("click", () => showWf(btn.dataset.wf));
});

/* ---------- feedback loop slides ---------- */
const LOOP_HINTS = [
  "點場景看「AI 要辨識什麼」。看起來不同，底層是同一套閉環。",
  "點步驟看說明。這不是 Tesla 介紹，是方法論案例。",
  "點對照或錯誤類型。重點是學會「什麼很像，但其實不是」。",
  "點傳統／要推的。高價值資料往往是 AI 最容易判斷錯的案例。",
  "同一個方法論放到機關資料上，會發生什麼？點高／低信心看分流。",
  "點 False Positive／False Negative。系統要統計的是「在哪些情況下容易錯」。",
  "點柱狀圖。這是品質管理方法，不是單純抽樣的作業指令。",
  "",
];

const LOOP_FILL = {
  "scene-tesla": "Tesla 要辨識：路況、車輛、行人。看起來很「自駕」，底層仍是：學正常與異常 → 不確定交給人 → 回饋再改善。",
  "scene-stock": "股票要辨識：K 線型態、成交量、價格行為。同樣是模式辨識，困難案例才送人看。",
  "scene-invoice": "發票要辨識：公司名稱、金額、日期、號碼，再判斷歸哪一類。低信心才進人工。",
  "scene-risk": "風險案件要辨識：異常交易、異常申報、異常關係。高風險與高不確定，才值得人判斷。",
  "scene-file": "文件歸檔要辨識：文件類型、案件、關聯性。不確定的歸檔，才留給人。",
  "tesla-data": "大量真實世界資料：不是實驗室裡的完美樣本，而是路上真正發生的事。",
  "tesla-ai": "AI 辨識：先判斷路況。重點不是判斷本身，而是判斷之後如何標出不確定、如何留下錯誤案例。",
  "tesla-hard": "發現困難案例：模型沒把握、或事後證明判斷不好的那些，才是教材。",
  "tesla-human": "人工確認／標註：人只看難的，不看全部。標註結果寫回下一輪。",
  "tesla-fix": "累積錯誤 → 改善模型 → 再部署 → 繼續收集困難案例。閉環一直轉。",
  "tesla-ask": "抽離自駕車之後，它其實是：資料 → 辨識 → 錯誤 → 人工回饋 → 學習 → 再辨識的閉環。",
  "stock-ai": "AI 一開始可能說：股票 A → 頭肩頂 → 信心 95%。看起來很篤定。",
  "stock-human": "人工看完：不是。不要只當成「AI 錯了」，而要問：為什麼錯？屬於哪一類錯？",
  "err-1": "① 假突破：價格像突破頸線，但沒站穩，型態看起來成立、其實沒走完。",
  "err-2": "② 成交量不符合：形狀像頭肩頂，但量能結構不對，只是「長得像」。",
  "err-3": "③ 左右肩比例異常：兩肩差太多，不像同一套型態，比較像硬套。",
  "err-4": "④ 時間跨度異常：壓得太短或拖太長，和典型頭肩頂的時間結構不符。",
  "err-5": "⑤ 型態不完整：缺一肩或頸線不清楚，AI 卻把它補完了。",
  "err-6": "⑥ 與歷史案例很像，但其實不是。這就是最重要的一課：AI 要學會「很像但不是」。",
  "abs-old": "傳統路徑：輸入 → 答案。錯了就當一次失敗，很少把錯誤本身當資料。",
  "abs-new": "要推的路徑：判斷 → 答案 → 錯了嗎？→ 錯誤分類 → 人工驗證 → 建立案例 → 改善。錯誤本身也是資料。",
  "abs-value": "高價值資料往往不是「AI 已經會的案例」，而是「AI 最容易判斷錯的案例」。這最適合往機關 AI 延伸。",
  "inv-hi": "高信心：公司名、金額、日期對得上，就自動歸檔。人不用每張都看。",
  "inv-lo": "低信心：欄位模糊、對不上、或模型沒把握 → 人工確認 → 寫進錯誤案例庫。",
  fp: "False Positive：AI 說「很可疑」，人工說「其實沒問題」。這是錯誤案例，用來降低誤報。",
  fn: "False Negative：AI 說「沒問題」，人工查出重大異常。這種案例往往更值錢，因為漏掉的成本高。",
  "bar-1": "第 1 輪：錯誤率約 8%。先有基準，才知道後面有沒有改善。",
  "bar-2": "第 2 輪：降到約 4%。不是換系統，而是錯誤分類後對準來源在改。",
  "bar-3": "第 3 輪：約 2%。抽驗比例可以隨信賴區間動態調整。",
  "bar-4": "第 4 輪：約 1%。目標不是一次滿分，而是可追蹤的下降機制。",
};

const ARCH_FLOW = {
  q: {
    title: "① 問題＋心智圖上下文",
    body: "使用者輸入自然語言；若從心智圖點選節點（如 OECD 第 VI 章），編排引擎把節點標題／路徑當 extra context，縮小檢索範圍。",
    tip: "query + optional mindmap_node_id",
  },
  retrieve: {
    title: "② 檢索 · 向量 + Hybrid",
    body: "Embedding 問題 → 向量索引 Top-K 20；必要時加 BM25 補條號／專有名詞。不是把整本 MD 塞給模型。",
    tip: "vector_top_k=20\nhybrid: optional",
  },
  rerank: {
    title: "③ 重排 · 20 → 6",
    body: "Reranker 用交叉編碼重新打分，留下最能回答「這一題」的約 6 段。向量相似≠最相關。",
    tip: "rerank_top_k=6",
  },
  gate: {
    title: "④ 門檻判斷 · 足夠嗎？",
    body: "看 Rerank 最高分與分數分布。低於校準門檻 → 不走生成，改澄清（請改寫、補關鍵字）或拒答（知識庫無依據）。",
    tip: "if max_score < threshold → fallback",
  },
  fallback: {
    title: "澄清／拒答",
    body: "查核場景寧可說「資料不足請補充」，也不要捏造法條。這步是信任設計，不是功能缺失。",
    tip: "response_mode: clarify | refuse",
  },
  assemble: {
    title: "組裝 Context",
    body: "把 6 段 retrieved_chunks + 系統 Prompt 模板 + 對話摘要（若有）排進 Token 預算。超長則截斷或摘要舊輪。",
    tip: "context_budget ≈ 32K",
  },
  generate: {
    title: "⑤ 生成 · LLM + Prompt",
    body: "呼叫 chat/completions；Temperature 0.15；輸出格式在 Prompt 寫死：推論思考、正式回答、查核實務、參考依據。可開 Streaming 改善體感。",
    tip: "temperature=0.15\nmax_output=3K~9K",
  },
  post: {
    title: "⑥ 後處理 · 引用＋信心",
    body: "解析 [知識庫 N] 對照 chunk_id；算 confidence；格式錯可重試一次。結果送 UI 並可存筆記／匯出。",
    tip: "cite_sources: required",
  },
};

const ARCH_SYS = {
  ui: {
    title: "UI 四 Tab",
    body: "AI小助手-NOTE精簡版V1.html：知識問答｜專業翻譯｜去識別化｜筆記本。一次只顯示一個工作區，避免拓撲樹、翻譯表、去識別表擠在同一頁。",
    path: "主 HTML + TP及BAPA專業助理/*.js",
  },
  router: {
    title: "意圖路由",
    body: "依 Tab 與關鍵字分流：租稅協定 → treaty_rate_ai；BAPA/CA/FAR → tp_bapa_reasoning；翻譯 Tab → translation_engine；去識別 Tab → deident_engine；其餘 → tp_reasoning + Mentor。",
    path: "tp_reasoning/mentor/mentor_mode_classifier.js · rag_intent_router.js",
  },
  "tp-reasoning": {
    title: "tp_reasoning",
    body: "16 步專業推理主引擎：理解→爭點樹→子引擎→攻防→證據→prompt_block。RAG 找段落，引擎決定分析結構。",
    path: "tp_reasoning/ · api.js · tp_reasoning_orchestrator.js",
  },
  "tp-bapa": {
    title: "tp_bapa_reasoning",
    body: "BAPA 規則塊：Critical Assumptions、FAR／受測個體。在 LLM 前產生 missing_facts 與 citations。",
    path: "tp_bapa_reasoning/engines/",
  },
  "tp-lego": {
    title: "tp_lego",
    body: "積木式子引擎：依題型組裝 FAR、方法選擇、可比、查核攻防、BAPA flow。實作核心在 tp_sub_engines.js。",
    path: "tp_reasoning/tp_sub_engines.js · tp_lego/",
  },
  translation: {
    title: "translation_engine",
    body: "獨立翻譯管線：術語庫+TM+分塊+QA+領域模式（treaty/oecd/tp/bapa）。",
    path: "translation_engine/",
  },
  deident: {
    title: "deident_engine",
    body: "規則驅動去識別：對照表即時同步、雙欄預覽、匯出。不用 LLM 隨機遮罩。",
    path: "deident_engine/ · tp_deident.js",
  },
  treaty: {
    title: "treaty_rate_ai",
    body: "協定 Rule DB + 事實萃取 + 決策引擎。LLM 不解釋稅率數字本身，只說明規則結果。",
    path: "treaty_rate_ai/",
  },
  rag: {
    title: "RAG 知識層",
    body: "tp_kb_rag.js 本機向量檢索；rag-java HybridSearch 可後端加強；知識庫/ 存法規 Markdown。",
    path: "知識庫/ · tp_kb_rag.js · rag-java/",
  },
  llm: {
    title: "LLM + Validator",
    body: "reasoning_llm_profile 選模型；agent_llm_orchestration 分 main/sub；tp_llm_output_validator 輸出檢查與重試。",
    path: "tp_reasoning/config/ · engines/tp_llm_output_validator.js",
  },
  output: {
    title: "結構化輸出",
    body: "prompt_block 進 LLM；回來後 UI Card 顯示推論、正式回答、實務、引用、信心。可存筆記。",
    path: "mentor_answer_engine.js · tp_evidence_citation.js",
  },
};

const ARCH_LOGIC = {
  start: {
    title: "使用者提問",
    body: "自然語言問題；可從心智圖帶入節點路徑作為檢索縮小範圍。",
    path: "UI 聊天輸入",
  },
  tab: {
    title: "哪個 Tab？",
    body: "四 Tab 決定主引擎：問答≠翻譯≠去識別。避免所有功能擠在同一個 generate()。",
    path: "主導覽 Tab 狀態",
  },
  intent: {
    title: "意圖分類",
    body: "在問答 Tab 內再分：租稅協定、BAPA、一般 TP、是否啟用 Mentor 深度模式。",
    path: "mentor_mode_classifier · TpReasoningAI",
  },
  treaty: {
    title: "租稅協定分支",
    body: "treaty_rate_ai.analyze()：萃取事實→所得類型→Rule DB→引用。結果併入 prompt_block，不讓 LLM 自創稅率。",
    path: "treaty_rate_ai/api.js",
  },
  bapa: {
    title: "BAPA 分支",
    body: "tp_bapa_reasoning：CA 與 FAR 規則引擎先跑，產生 warnings / missing_facts。",
    path: "tp_bapa_reasoning/api.js",
  },
  reason: {
    title: "tp_reasoning + tp_lego",
    body: "主推理 16 步 + 積木子引擎（FAR/方法/可比/查核/BAPA）。",
    path: "tp_reasoning_orchestrator.js · tp_sub_engines.js",
  },
  mentor: {
    title: "Mentor 深度增強",
    body: "深度案件：事實矩陣、紅旗、辯論輪、證據請求、利潤移轉等 20+ 模組 enhance。",
    path: "tp_reasoning/mentor/mentor_orchestrator.js",
  },
  rag: {
    title: "RAG 檢索",
    body: "TpReasoningAI.boostKbChunks() 對知識庫段落重排；與規則引擎結果並行。",
    path: "tp_context_retrieval.js · tp_kb_rag.js",
  },
  prompt: {
    title: "組 prompt_block",
    body: "規則引擎輸出 + retrieved_chunks + 系統禁則 → 完整 Prompt。LLM 只負責自然語言。",
    path: "tp_reasoning_orchestrator buildPromptBlock",
  },
  llm: {
    title: "LLM 生成",
    body: "依 profile 呼叫模型；可串流；Main/Sub agent 可分工（KB 檢索 vs 主回答）。",
    path: "tp_llm_client.mjs · agent_llm_orchestration.json",
  },
  valid: {
    title: "Validator 重試",
    body: "tp_llm_output_validator 檢查格式與禁則；失敗可重試，避免幻覺條文。",
    path: "engines/tp_llm_output_validator.js",
  },
  end: {
    title: "UI 呈現",
    body: "結構化卡片：推論、正式回答、查核實務、引用。可匯出筆記。",
    path: "UI render + tp_note_actions",
  },
};

const ARCH_LAYER_HINT = {
  "layer-ui": "<strong>介面層</strong>：聊天窗、心智圖、筆記本、匯出 Word/PDF。只負責「展示」與「送 API」，不自己做檢索。",
  "layer-orchestrator": "<strong>編排引擎</strong>：問答總指揮。決定何時檢索、何時拒答、何時叫 LLM。改流程改這層，不用動 UI。",
  "layer-retrieval": "<strong>檢索＋重排</strong>：Embedding、向量索引、Hybrid、Reranker。品質問題多半調這層參數（Top-K、Chunk）。",
  "layer-generation": "<strong>生成＋後處理</strong>：LLM 呼叫、串流、引用解析、信心評估。Prompt 模板也掛在這層附近。",
  "layer-knowledge": "<strong>知識層</strong>：Markdown 原文、切塊、metadata、向量索引。一切答案的「食材來源」。",
};

const ARCH_POP = {
  "layer-ui": {
    eyebrow: "系統架構 · 第⑤層",
    title: "介面層 UI",
    html: `<p class="modal-lead">使用者只看得到這一層，但這層<strong>不該</strong>自己跑 RAG。</p>
      <ul class="check-list"><li>聊天：送 query、顯示串流答案與引用</li><li>心智圖：點節點帶入上下文</li><li>筆記：存問答、匯出、可回寫知識庫</li><li>設定：模型、API（示範版本機 Key）</li></ul>
      <p class="modal-note">設計原則：UI 薄、邏輯在後端編排。</p>`,
  },
  "layer-orchestrator": {
    eyebrow: "系統架構 · 第④層",
    title: "編排引擎 Orchestrator",
    html: `<p class="modal-lead">這是「引擎」的核心——<strong>不是 Prompt 字串</strong>，而是可測試的流程程式。</p>
      <div class="vflow"><span>收到 query</span><span class="arrow">↓</span><span>呼叫檢索模組</span><span class="arrow">↓</span><span>評分門檻</span><span class="arrow">↓</span><span>組 Context → 生成 → 後處理</span><span class="arrow">↓</span><span>回傳 JSON</span></div>
      <p class="modal-note">換 Reranker 或 LLM 時，編排接口不變，這就是模組化的好處。</p>`,
  },
  "layer-retrieval": {
    eyebrow: "系統架構 · 第③層",
    title: "檢索＋重排引擎",
    html: `<p class="modal-lead">決定「模型這次看到哪幾段法規」——比 Prompt 寫得漂亮更重要。</p>
      <ol class="sample-steps"><li>Query Embedding</li><li>Vector Top-K 20</li><li>（可選）Hybrid 關鍵字</li><li>Rerank → 6 段</li></ol>
      <p class="modal-note">教室參數區的 Chunk、Top-K、Rerank 都調這層。</p>`,
  },
  "layer-generation": {
    eyebrow: "系統架構 · 第②層",
    title: "生成＋後處理",
    html: `<p class="modal-lead">LLM 只負責「依規則寫答案」；引用對不對、信心高不高由後處理管。</p>
      <ul class="check-list"><li>Prompt 模板：角色、格式、禁則</li><li>LLM API：temperature、max_tokens</li><li>Post-process：citations、confidence</li></ul>`,
  },
  "layer-knowledge": {
    eyebrow: "系統架構 · 第①層",
    title: "知識層 Knowledge",
    html: `<p class="modal-lead">沒有這層，上面全部空轉。Markdown 不是拿來「貼進對話框」，而是<strong>切塊入庫</strong>。</p>
      <ul class="check-list"><li>OECD TPG、台灣查核準則、BAPA…分檔</li><li>Chunk + metadata（章節、版本）</li><li>Ingest API 更新索引</li></ul>`,
  },
  "mod-ingest": {
    eyebrow: "模組 · 入庫",
    title: "Ingest 入庫模組",
    html: `<p class="modal-lead">開發時先做這條管線，再做問答。</p>
      <div class="vflow"><span>Markdown/PDF</span><span class="arrow">↓</span><span>切塊 Chunk+Overlap</span><span class="arrow">↓</span><span>Embedding</span><span class="arrow">↓</span><span>寫入向量索引</span></div>
      <p class="modal-note">驗收：入庫後用固定 query 能撈到預期段落。</p>`,
  },
  "mod-retrieval": {
    eyebrow: "模組 · 檢索",
    title: "Retrieval 檢索引擎",
    html: `<p class="modal-lead">依<strong>意思</strong>找段落；法規場景建議加 Hybrid 防漏條號。</p>
      <p class="modal-note">調參重點：Top-K 先寬（20），靠 Rerank 精選。</p>`,
  },
  "mod-rerank": {
    eyebrow: "模組 · 重排",
    title: "Rerank 重排引擎",
    html: `<p class="modal-lead">品質開關。關掉 Rerank 常見現象：撈到的段落「像有關」但答非所問。</p>
      <p class="modal-note">建議留下 5～8 段（TP NOTE01 用 6）。</p>`,
  },
  "mod-context": {
    eyebrow: "模組 · 組裝",
    title: "Context 組裝",
    html: `<p class="modal-lead">把檢索結果排進 Prompt 的 {{retrieved_chunks}}，並控制總 Token 不超過 Context 上限。</p>
      <p class="modal-note">心智圖節點、對話摘要也會佔額度，要一起算。</p>`,
  },
  "mod-prompt": {
    eyebrow: "模組 · Prompt",
    title: "Prompt 模板",
    html: `<p class="modal-lead">Prompt 是模組之一，不是全部。TP NOTE01 固定四段輸出＋禁則（避風港勿混淆等）。</p>
      <p class="modal-note">模板放檔案或資料庫，版本可追蹤，比寫死在程式裡好維護。</p>`,
  },
  "mod-generate": {
    eyebrow: "模組 · 生成",
    title: "Generation 生成引擎",
    html: `<p class="modal-lead">呼叫 LLM API；可 Streaming。查核用低 temperature。</p>
      <p class="modal-note">生成引擎不決定「撈哪些段」——那是檢索的事。</p>`,
  },
  "mod-post": {
    eyebrow: "模組 · 後處理",
    title: "Post-process 後處理",
    html: `<p class="modal-lead">讓答案<strong>可核對</strong>：引用 chunk、信心、follow-up。</p>
      <p class="modal-note">低信心不要當 high 顯示給查核員。</p>`,
  },
  "mod-notes": {
    eyebrow: "模組 · 筆記",
    title: "筆記／匯出模組",
    html: `<p class="modal-lead">問答結果變成可查核員工資產：存筆記、匯出 Word/PDF、可選回寫知識庫。</p>
      <p class="modal-note">這是 V1 功能，MVP 可先做「複製＋下載」。</p>`,
  },
  "chatgpt-compare": {
    eyebrow: "體驗對照",
    title: "只有 Prompt vs 引擎管線",
    html: `<table class="mini-table"><tr><th></th><th>只 Prompt+MD</th><th>引擎+模組</th></tr>
      <tr><td>知識從哪來</td><td>貼全文／靠模型記</td><td>檢索 chunks</td></tr>
      <tr><td>答錯時</td><td>改整份 Prompt</td><td>調檢索／Rerank／門檻</td></tr>
      <tr><td>引用</td><td>常造假或沒有</td><td>後處理對 chunk_id</td></tr>
      <tr><td>多輪</td><td>容易越聊越偏</td><td>每輪重新檢索</td></tr>
      <tr><td>像 ChatGPT</td><td>偶爾像、不可控</td><td>串流+結構+拒答，可驗收</td></tr></table>`,
  },
  "dev-1": {
    eyebrow: "開發流程 · Step 1",
    title: "構想＋SPEC",
    html: `<p class="modal-lead">交付物：一句話目的、MVP 邊界、輸入輸出、驗收黃金題清單。</p>
      <p class="modal-note">對照本站 01 構想、03 SPEC。</p>`,
  },
  "dev-2": {
    eyebrow: "開發流程 · Step 2",
    title: "知識庫地圖",
    html: `<p class="modal-lead">OECD、台灣準則、三層文據、BAPA…分檔；每檔標 metadata。</p>
      <p class="modal-note">對照案例 TP NOTE01 知識庫地圖 Tab。</p>`,
  },
  "dev-3": {
    eyebrow: "開發流程 · Step 3",
    title: "入庫管線",
    html: `<p class="modal-lead">Chunk、Overlap、Embedding、索引。先跑通 ingest API。</p>`,
  },
  "dev-4": {
    eyebrow: "開發流程 · Step 4",
    title: "檢索＋重排",
    html: `<p class="modal-lead">接 vector search + reranker；用黃金題看撈到的段對不對。</p>`,
  },
  "dev-5": {
    eyebrow: "開發流程 · Step 5",
    title: "Prompt 模板",
    html: `<p class="modal-lead">角色、四段格式、禁則。Prompt 是模組，接在 Context 組裝之後。</p>`,
  },
  "dev-6": {
    eyebrow: "開發流程 · Step 6",
    title: "API 串接",
    html: `<p class="modal-lead">POST /chat/query、PUT /kb/documents、GET /health。前端只打自家後端。</p>
      <p class="modal-note">對照本站 05 API 區。</p>`,
  },
  "dev-7": {
    eyebrow: "開發流程 · Step 7",
    title: "UI 模組",
    html: `<p class="modal-lead">聊天、心智圖、筆記、設定。MVP 可先做聊天+引用。</p>`,
  },
  "dev-8": {
    eyebrow: "開發流程 · Step 8",
    title: "黃金題驗收",
    html: `<p class="modal-lead">避風港、BAPA、可比法…每題檢查引用是否正確、有無混淆概念。</p>
      <p class="modal-note">調參後必跑同一套題，才算客觀改善。</p>`,
  },
  "dev-9": {
    eyebrow: "開發流程 · Step 9",
    title: "部署＋回饋",
    html: `<p class="modal-lead">本機／內網部署；錯誤問答回寫成案例，接 12 回饋迴路思維。</p>`,
  },
  "dev-full": {
    eyebrow: "完整流程圖",
    title: "TP NOTE01 開發路徑",
    html: `<div class="vflow">
      <span>SPEC</span><span class="arrow">↓</span>
      <span>知識庫地圖</span><span class="arrow">↓</span>
      <span>Ingest 入庫</span><span class="arrow">↓</span>
      <span>Retrieval + Rerank</span><span class="arrow">↓</span>
      <span>Prompt 模板</span><span class="arrow">↓</span>
      <span>編排引擎串 API</span><span class="arrow">↓</span>
      <span>UI（聊天/心智圖/筆記）</span><span class="arrow">↓</span>
      <span>黃金題驗收</span><span class="arrow">↓</span>
      <span>部署 → 回饋改善 ↺</span>
    </div>
    <p class="modal-note">與「只叫 AI 寫一個聊天網頁」差別：中間每步都有可驗收的交付物。</p>`,
  },
  "diag-system-arch": {
    eyebrow: "完整架構圖",
    title: "AI-NOTE01 系統架構（上課版）",
    html: `<div class="vflow">
      <span><strong>UI</strong>：AI小助手-NOTE精簡版V1.html — 四 Tab（知識問答｜專業翻譯｜去識別化｜筆記本）</span>
      <span class="arrow">↓</span>
      <span><strong>意圖路由</strong>：mentor_mode_classifier · treaty 關鍵字 · Tab 隔離（翻譯／去識別不進 TP 推理）</span>
      <span class="arrow">↓</span>
      <div class="vflow-split">
        <div><span>tp_reasoning</span><span class="arrow">→</span><span>16 步推理 + Mentor</span></div>
        <div><span>tp_bapa_reasoning</span><span class="arrow">→</span><span>CA / FAR 規則塊</span></div>
        <div><span>tp_lego</span><span class="arrow">→</span><span>子引擎積木（FAR/方法/可比…）</span></div>
        <div><span>translation_engine</span><span class="arrow">→</span><span>術語+TM+QA</span></div>
        <div><span>deident_engine</span><span class="arrow">→</span><span>去識別規則</span></div>
        <div><span>treaty_rate_ai</span><span class="arrow">→</span><span>協定 Rule DB</span></div>
      </div>
      <span class="arrow">↓</span>
      <span><strong>RAG</strong>：tp_kb_rag.js · rag-java HybridSearch · 知識庫/ 法規 Markdown</span>
      <span class="arrow">↓</span>
      <span><strong>LLM</strong>：reasoning_llm_profile · agent_llm_orchestration · tp_llm_output_validator</span>
      <span class="arrow">↓</span>
      <span><strong>輸出</strong>：prompt_block + UI Card + citations + 筆記匯出</span>
    </div>
    <p class="modal-note">原則：<strong>一個 Tab／一種任務 = 一條獨立引擎管線</strong>，共用 RAG 與 LLM 設定，但不共用 Prompt 模板。</p>`,
  },
  "diag-logic-flow": {
    eyebrow: "完整邏輯圖",
    title: "知識問答 · 一題進來怎麼答（邏輯順序）",
    html: `<ol class="sample-steps">
      <li><strong>使用者提問</strong>（可帶心智圖節點上下文）</li>
      <li><strong>Tab 判斷</strong>：若在「翻譯／去識別」Tab → 走對應引擎，<em>不</em>進 tp_reasoning</li>
      <li><strong>租稅協定？</strong> → treaty_rate_ai.analyze()：事實萃取 → 所得分類 → Rule DB → 引用（LLM 只解釋）</li>
      <li><strong>BAPA / CA / FAR？</strong> → tp_bapa_reasoning：規則產生 missing_facts、warnings、citations</li>
      <li><strong>一般 TP</strong> → tp_reasoning.process()：理解 → Issue Tree → tp_lego 子引擎 → 攻防 → 敏感度</li>
      <li><strong>深度案件</strong> → MentorAI.enhance()：事實矩陣、紅旗、辯論輪、證據請求…</li>
      <li><strong>RAG</strong>：TpReasoningAI.boostKbChunks() 重排知識庫段落</li>
      <li><strong>組裝</strong>：規則引擎的 prompt_block + retrieved_chunks → 送 LLM</li>
      <li><strong>生成</strong>：串流輸出；validator 失敗可重試</li>
      <li><strong>呈現</strong>：結構化 UI Card、引用、可存筆記</li>
    </ol>
    <p class="modal-note">關鍵：<strong>RAG 找證據，Rule Engine 決定怎麼分析，LLM 寫自然語言</strong>——不是一個 Prompt 包到底。</p>`,
  },
  "eng-tp-reasoning": {
    eyebrow: "實機引擎",
    title: "tp_reasoning／TP 專業推理主引擎",
    html: `<p class="modal-lead"><strong>為何獨立？</strong>移轉訂價問答不是 FAQ。要先分題型、建爭點樹、跑子引擎、列缺失事實與攻防，再請 LLM 寫人話。全部寫在一個 Prompt 無法維護、無法用黃金題驗收。</p>
      <div class="modal-block"><h4>核心方法（16 步 pipeline）</h4>
      <p>Question → Classification → Fact Extraction → Issue Tree → Legal Stack → Sub-Engines → Counterarguments → Missing Facts → Sensitivity → Evidence → Prompt Block → LLM</p></div>
      <div class="modal-block"><h4>技術</h4>
      <ul class="check-list"><li>目錄：<code>tp_reasoning/</code> · 入口 <code>api.js</code>（TpReasoningAI）</li><li>編排：<code>tp_reasoning_orchestrator.js</code></li><li>Mentor 層：<code>mentor/</code>（20+ 子模組）</li><li>HTTP：<code>server/</code> POST /v1/chat/query</li><li>LLM 設定：<code>config/reasoning_llm_profile.json</code>、<code>agent_llm_orchestration.json</code></li><li>驗收：<code>tests/golden_cases.jsonl</code>、run_golden_eval.mjs</li></ul></div>
      <p class="modal-note">SPEC：<code>tp_reasoning/SPEC.md</code>、<code>mentor/MENTOR_AI_SPEC.md</code></p>`,
  },
  "eng-tp-bapa": {
    eyebrow: "實機引擎",
    title: "tp_bapa_reasoning／BAPA 專用推理",
    html: `<p class="modal-lead"><strong>為何獨立？</strong>BAPA 有 Critical Assumptions、FAR／受測個體等<strong>規則型</strong>問題，要在呼叫 LLM 前先產生結構化分析塊，並與租稅協定結果（beneficial owner 等）交叉檢查。</p>
      <div class="modal-block"><h4>方法</h4>
      <p>偵測 BAPA/CA/FAR 題 → <code>critical_assumptions.js</code> / <code>far_tested_party.js</code> → 合併 missing_facts、warnings、citations → 併入 tp_reasoning 的 prompt_block</p></div>
      <div class="modal-block"><h4>技術</h4>
      <ul class="check-list"><li>目錄：<code>tp_bapa_reasoning/</code></li><li>API：<code>api.js</code>（BapaReasoningAI.analyze）</li><li>與 <code>treaty_rate_ai</code> 串接：協定資格不確定時寫入 warnings</li></ul></div>
      <p class="modal-note">BAPA 爭議深度模擬另見 <code>tp_reasoning/bapa_controversy/</code>（談判、讓步、雙方 CA 等）。</p>`,
  },
  "eng-tp-lego": {
    eyebrow: "實機引擎",
    title: "tp_lego／TP 積木子引擎",
    html: `<p class="modal-lead"><strong>為何獨立？</strong>不同問題要裝不同「積木」：FAR 題裝 FAR 積木、可比題裝可比積木。像 LEGO 依題型 snap-in，而不是每次把全部規則塞進 Prompt。</p>
      <div class="modal-block"><h4>積木清單（tp_sub_engines）</h4>
      <ul class="check-list"><li>FARReasoningEngine — 功能／資產／風險 → 受測個體</li><li>TPMethodSelectionEngine — 方法選擇</li><li>ComparableReasoningEngine — 可比分析</li><li>TPAuditReasoningEngine — 查核論述</li><li>AuditDebateEngine — 攻防辯論</li><li>BAPAReasoningEngine — BAPA 流程</li></ul></div>
      <div class="modal-block"><h4>技術</h4>
      <p>實作：<code>tp_reasoning/tp_sub_engines.js</code>，由 orchestrator 依 question_type 呼叫 <code>TpSubEngines.runSubEngines()</code>。獨立目錄 <code>tp_lego/</code> 為積木化封裝，方便單獨測試與擴充。</p></div>`,
  },
  "eng-translation": {
    eyebrow: "實機引擎",
    title: "translation_engine／專業翻譯引擎",
    html: `<p class="modal-lead"><strong>為何獨立？</strong>翻譯要「翻概念、不翻錯術語」，和問答是不同任務。需術語庫、翻譯記憶、法律結構、回譯 QA——不能和 TP 問答共用一條 Prompt。</p>
      <div class="modal-block"><h4>管線（Mode C · 法律／稅務專業翻譯）</h4>
      <p>TranslationContext → 文件分類 → Terminology + TM → TranslationPromptEngine → LLM → Native/Taiwan Editor → TranslationQAEngine（可 back-translation）</p></div>
      <div class="modal-block"><h4>技術</h4>
      <ul class="check-list"><li>202+ MOF 術語、<code>terminology_seed.jsonl</code></li><li>領域模式：treaty / oecd / tp / bapa / correspondence</li><li>Golden：<code>data/golden/</code> · eval：run_translation_eval.mjs</li><li>SPEC：<code>TRANSLATION_ENGINE_SPEC.md</code></li></ul></div>`,
  },
  "eng-deident": {
    eyebrow: "實機引擎",
    title: "deident_engine／去識別化引擎",
    html: `<p class="modal-lead"><strong>為何獨立？</strong>去識別是<strong>規則＋對照表</strong>任務，不是生成式問答。要即時雙欄預覽、甲乙丙丁→ABCD、可匯出——必須獨立 Tab 與引擎，避免 LLM 隨機改寫當事人代號。</p>
      <div class="modal-block"><h4>方法</h4>
      <p>使用者貼文／上傳 → 對照表驅動替換 → 左原文｜右去識別即時同步 → 匯出 Word／PDF</p></div>
      <div class="modal-block"><h4>技術</h4>
      <ul class="check-list"><li>UI：<code>TP及BAPA專業助理/tp_deident.js</code></li><li>獨立引擎目錄：<code>deident_engine/</code>（規則與對照邏輯抽離）</li><li>原則：可規則化處理，不硬叫 LLM「幫我遮」</li></ul></div>`,
  },
  "eng-treaty-rate": {
    eyebrow: "實機引擎",
    title: "treaty_rate_ai／租稅協定稅率 AI",
    html: `<p class="modal-lead"><strong>為何獨立？</strong>協定稅率、適用要件、MLI 等必須查<strong>結構化 Rule DB</strong>。LLM 不能「決定」稅率，只能依規則引擎結果解釋。這是 Rule Engine + RAG + LLM 的典型分工。</p>
      <div class="modal-block"><h4>管線</h4>
      <p>Fact Extraction → Income Classification → Eligibility → Treaty Rule DB → Decision Engine → Citation → Validator →（可選）LLM 論述</p></div>
      <div class="modal-block"><h4>技術</h4>
      <ul class="check-list"><li><code>data/treaty_rules_*.jsonl</code>、MLI、國內法對照</li><li>engines：pe_decision、exception、legal_source…</li><li>retrieval/hybrid.js · 100+ golden cases</li><li>與 TP 串接：<code>tp_bapa_chain.js</code></li></ul></div>
      <p class="modal-note">原則：<code>maximum_rate</code> ≠ <code>fixed_rate</code> ≠ 臆測 applicable rate</p>`,
  },
  "eng-treaty-treatment": {
    eyebrow: "實機引擎 · 舊版",
    title: "treaty_treatment／協定處理（Legacy）",
    html: `<p class="modal-lead"><strong>為何曾獨立？</strong>早期租稅協定問答的 rule engine 原型：<code>treaty_decision_engine.js</code>、<code>treaty_kb_retrieval.js</code>。</p>
      <p class="modal-note">現行開發以 <strong>treaty_rate_ai</strong> 為主（更完整 SPEC、MLI、validator、golden eval）。treaty_treatment 保留作對照與漸進遷移；上課可說明「同一問題的引擎演進」。</p>`,
  },
  "eng-training": {
    eyebrow: "實機引擎",
    title: "training／訓練資料管線（Phase 12）",
    html: `<p class="modal-lead"><strong>為何獨立？</strong>Fine-tuning／LoRA 是<strong>離線資料工程</strong>，不該和線上問答引擎混在一起。要有獨立工具把案例庫、golden L3 轉成訓練 JSONL。</p>
      <div class="modal-block"><h4>方法</h4>
      <p><code>node tp_reasoning/tools/build_finetune_dataset.mjs</code> → <code>tp_reasoning/data/finetune/mentor_chat_train.jsonl</code>（OpenAI chat 格式）</p></div>
      <div class="modal-block"><h4>技術</h4>
      <ul class="check-list"><li>來源：case_scenario_db、golden L3、mentor 教學層</li><li>目錄 <code>training/</code> 彙整訓練腳本與產出</li><li>尚未等於正式上線訓練——需人工審核 skeleton 與 L6 內容</li></ul></div>`,
  },
  "eng-node-modules": {
    eyebrow: "依賴層（非業務引擎）",
    title: "node_modules／npm 執行環境",
    html: `<p class="modal-lead"><strong>這不是業務引擎。</strong>是 <code>tp_reasoning/server</code> 等 Node 專案安裝的第三方套件（express、dotenv…），由 <code>npm install</code> 產生。</p>
      <ul class="check-list"><li>不寫進架構簡報的「八大引擎」</li><li>上課可一句帶過：server 端需要 Node 依賴；瀏覽器端引擎多為純 JS script 載入</li><li>勿 commit 進 Git（已在 .gitignore）</li></ul>`,
  },
};

const LOOP_POP = {
  "tesla-flow": {
    eyebrow: "案例一 · 只借方法",
    title: "Tesla 的學習閉環",
    html: `<p class="modal-lead">不要講自駕技術細節。只看這件事怎麼轉一圈。</p>
      <div class="vflow">
        <span>大量真實世界資料</span><span class="arrow">↓</span>
        <span>AI 辨識</span><span class="arrow">↓</span>
        <span>發現困難案例</span><span class="arrow">↓</span>
        <span>人工確認／標註</span><span class="arrow">↓</span>
        <span>累積錯誤案例</span><span class="arrow">↓</span>
        <span>重新改善模型</span><span class="arrow">↓</span>
        <span>再次部署</span><span class="arrow">↓</span>
        <span>繼續收集困難案例</span><span class="arrow">↺</span>
      </div>
      <p class="modal-note">抽離自駕車：資料 → 辨識 → 錯誤 → 人工回饋 → 學習 → 再辨識。</p>`,
  },
  "tesla-vision": {
    eyebrow: "案例一 · 方法論故事",
    title: "放棄雷達、只用鏡頭：辨識率怎麼拉高？",
    html: `<p class="modal-lead">重點不是「鏡頭比較酷」，而是：當你拿掉一種感測器，系統更容易暴露弱點；弱點被抓出來、標註、回餵，辨識才會變好。</p>
      <div class="modal-block">
        <h4>故事在講什麼</h4>
        <p>早期自駕常見做法是<strong>鏡頭＋雷達</strong>（有的還加光達）：鏡頭看形狀與顏色，雷達測距離與速度。Tesla 後來走向<strong>Tesla Vision</strong>——以鏡頭為主、逐步拿掉雷達。外界常問：少一種感測器，怎麼可能更準？</p>
      </div>
      <div class="modal-block">
        <h4>方法論上的答案</h4>
        <ol class="sample-steps">
          <li><strong>統一「看世界的方式」</strong>：多感測器要對齊、融合；衝突時系統會「誰說了算」搞不清。改成以鏡頭為主，訓練與錯誤定義更一致。</li>
          <li><strong>車隊就是樣本工廠</strong>：路上真實畫面持續進來——陽光、大雨、逆光、施工、奇怪路況，都是教材。</li>
          <li><strong>專抓困難案例</strong>：影子像行人、塑膠袋像障礙、標線模糊、少見路口……模型沒把握或事後出錯的，優先標註。</li>
          <li><strong>人工標註 → 回餵模型</strong>：不是一次升級就滿分，而是一輪輪把「很像但不是」「看不清」變成可學習資料。</li>
          <li><strong>再部署、再收集</strong>：新版上路後又冒出新困難案例，閉環繼續轉，辨識率才往上爬。</li>
        </ol>
      </div>
      <div class="modal-block">
        <h4>你可以怎麼講給聽眾</h4>
        <p>「他們不是靠多加一台儀器變準，而是靠<strong>暴露錯誤 → 分類錯誤 → 用錯誤練下一代</strong>。少了雷達之後，鏡頭模型必須自己學距離與速度，弱點更明顯，改善路徑也更清楚。」</p>
      </div>
      <p class="modal-note">課堂用途：這是方法論案例，不是替任何車廠背書，也不討論法規與安全爭議。</p>`,
  },
  "abs-flow": {
    eyebrow: "抽象化",
    title: "錯誤本身也是資料",
    html: `<div class="vflow">
        <span>輸入</span><span class="arrow">↓</span>
        <span>AI 判斷</span><span class="arrow">↓</span>
        <span>答案</span><span class="arrow">↓</span>
        <span>錯誤？</span><span class="arrow">↓</span>
        <span>錯誤分類</span><span class="arrow">↓</span>
        <span>人工驗證</span><span class="arrow">↓</span>
        <span>建立案例</span><span class="arrow">↓</span>
        <span>模型／規則改善</span>
      </div>
      <p class="modal-note">因此：高價值資料往往是 AI 最容易判斷錯的案例。</p>`,
  },
  "invoice-flow": {
    eyebrow: "可能的應用案例",
    title: "自動發票歸檔",
    html: `<p class="modal-lead">不是批評現有發票系統，而是問：同一套方法論放上來會怎樣？</p>
      <div class="vflow">
        <span>發票</span><span class="arrow">↓</span>
        <span>AI 辨識（公司名稱、金額、日期、號碼）</span><span class="arrow">↓</span>
        <span>自動判斷應歸哪一類</span><span class="arrow">↓</span>
        <div class="vflow-split">
          <div><span>高信心</span><span class="arrow">↓</span><span>自動歸檔</span></div>
          <div><span>低信心</span><span class="arrow">↓</span><span>人工確認</span></div>
        </div>
        <span class="arrow">↓</span>
        <span>錯誤案例庫</span><span class="arrow">↓</span>
        <span>改善模型</span>
      </div>`,
  },
  flywheel: {
    eyebrow: "AI 輔助風險管理",
    title: "AI Risk Learning Loop",
    html: `<div class="vflow">
        <span>歷史案件</span><span class="arrow">↓</span>
        <span>AI 風險辨識</span><span class="arrow">↓</span>
        <span>風險評分</span><span class="arrow">↓</span>
        <div class="vflow-split">
          <div><span>低風險</span><span class="arrow">↓</span><span>自動處理／一般流程</span></div>
          <div><span>高風險</span><span class="arrow">↓</span><span>人工確認</span><span class="arrow">↓</span><span>真風險／假風險</span></div>
        </div>
        <span class="arrow">↓</span>
        <span>錯誤案例資料庫</span><span class="arrow">↓</span>
        <span>模型／規則改善</span><span class="arrow">↓</span>
        <span>下一批案件 ↺</span>
      </div>
      <p class="modal-note">這已經不是發票 OCR，而是 AI 輔助風險管理架構。</p>`,
  },
  "sample-flow": {
    eyebrow: "統計品質控制",
    title: "基準樣本，不是作業指令",
    html: `<p class="modal-lead">任何 AI 自動化流程，全面自動化前，可先建立基準樣本集，用抽樣估計錯誤率與錯誤結構。</p>
      <div class="vflow">
        <span>初始樣本</span><span class="arrow">↓</span>
        <span>人工驗證</span><span class="arrow">↓</span>
        <span>錯誤分類</span><span class="arrow">↓</span>
        <span>錯誤率 → 信賴區間</span><span class="arrow">↓</span>
        <span>找出主要錯誤來源</span><span class="arrow">↓</span>
        <span>改善</span><span class="arrow">↓</span>
        <span>再次抽樣</span>
      </div>
      <p class="modal-note">錯誤率下降就少抽；上升或區間變寬就多抽。</p>
      <div class="modal-block sample-case">
        <h4>短例 · 自動發票歸檔</h4>
        <ol class="sample-steps">
          <li><strong>抽 1,000 張</strong>最近發票（隨機，不要只挑難的）。</li>
          <li><strong>人工核對</strong>關鍵欄位與歸檔類別 → 假設錯 80 件＝錯誤率 <strong>8%</strong>。</li>
          <li><strong>分類錯誤</strong>：金額 OCR 35%、公司名 25%、歸檔邊界 20%、日期 15%……</li>
          <li><strong>估區間</strong>：約 8% ± 1.7%（真正錯誤率大概在 6～10%）。</li>
          <li><strong>對準大頭改善</strong>：先修金額 OCR、寫清交際／差旅規則；低信心送人工。</li>
          <li><strong>再抽樣</strong>：8% → 4% → 2% → 1%；錯誤率降、區間變窄就少抽，反之多抽。</li>
        </ol>
        <p class="sample-aside">換成風險案件時，把「欄位錯」改成 False Positive／False Negative；漏掉真異常（FN）通常要加重權重。</p>
      </div>`,
  },
  biz: {
    eyebrow: "拉回業務",
    title: "用在風險案件辨識",
    html: `<p class="modal-lead">如果未來把這個方法論應用到風險案件辨識，例如從歷史案件中建立正常與異常樣態，透過 AI 進行風險排序，再由人工針對高風險或 AI 高不確定性案件進行確認，人工確認結果再反饋成下一輪模型改善資料，則可以逐步形成「AI 辨識—人工驗證—錯誤分類—模型改善」的閉環。</p>
      <p class="modal-note">我們不是把人拿掉，而是讓人專注在 AI 最不確定、最容易錯、也最值得人工判斷的案件。</p>`,
  },
};

function closeLoopModal() {
  hide(loopModal);
  if (!anyModalOpen()) document.body.classList.remove("modal-open");
}

function openLoopModal(key) {
  const data = ARCH_POP[key] || LOOP_POP[key];
  if (!data || !loopModal) return;
  const eye = $("#loopModalEyebrow");
  const title = $("#loopModalTitle");
  const body = $("#loopModalBody");
  if (eye) eye.textContent = data.eyebrow;
  if (title) title.textContent = data.title;
  if (body) body.innerHTML = data.html;
  show(loopModal);
  document.body.classList.add("modal-open");
}

function setLoopFill(text) {
  const box = $("#loopFillBody");
  const wrap = $("#loopFill");
  if (box) box.textContent = text || "";
  if (wrap) {
    if (text) {
      wrap.hidden = false;
      wrap.removeAttribute("hidden");
    } else {
      wrap.hidden = true;
      wrap.setAttribute("hidden", "");
    }
  }
}

function showLoopFill(key, btn) {
  const text = LOOP_FILL[key];
  if (!text) return;
  setLoopFill(text);
  const slide = btn?.closest(".loop-slide");
  if (!slide) return;
  $all("[data-loop-fill]", slide).forEach((el) => el.classList.toggle("active", el === btn));
}

function showLoopSlide(i) {
  loopSlideIndex = Math.max(0, Math.min(i, LOOP_SLIDE_COUNT - 1));
  closeLoopModal();
  $all(".loop-slide").forEach((slide) => {
    const on = Number(slide.dataset.loop) === loopSlideIndex;
    slide.classList.toggle("active", on);
    slide.hidden = !on;
    if (!on) $all("[data-loop-fill]", slide).forEach((el) => el.classList.remove("active"));
  });
  $all(".loop-dot").forEach((d, idx) => {
    d.classList.toggle("active", idx === loopSlideIndex);
    d.setAttribute("aria-selected", String(idx === loopSlideIndex));
  });
  setLoopFill(LOOP_HINTS[loopSlideIndex] || "");
  const kicker = $("#loopKicker");
  if (kicker) kicker.textContent = `Slide ${loopSlideIndex + 1} / ${LOOP_SLIDE_COUNT}`;
  const prev = $("#loopPrev");
  const next = $("#loopNext");
  if (prev) prev.disabled = loopSlideIndex <= 0;
  if (next) next.disabled = loopSlideIndex >= LOOP_SLIDE_COUNT - 1;
  if (deckMode) updateProgressUI();
}

function initLoopDots() {
  const dots = $("#loopDots");
  if (!dots || dots.childElementCount) return;
  for (let i = 0; i < LOOP_SLIDE_COUNT; i += 1) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "loop-dot" + (i === 0 ? " active" : "");
    b.setAttribute("aria-label", `第 ${i + 1} 張`);
    b.addEventListener("click", () => showLoopSlide(i));
    dots.appendChild(b);
  }
}

initLoopDots();
showLoopSlide(0);

$("#loopPrev")?.addEventListener("click", () => showLoopSlide(loopSlideIndex - 1));
$("#loopNext")?.addEventListener("click", () => showLoopSlide(loopSlideIndex + 1));

$("#loopDeck")?.addEventListener("click", (e) => {
  const pop = e.target.closest("[data-loop-pop]");
  if (pop) {
    openLoopModal(pop.dataset.loopPop);
    return;
  }
  const fillBtn = e.target.closest("[data-loop-fill]");
  if (fillBtn) showLoopFill(fillBtn.dataset.loopFill, fillBtn);
});

/* ---------- AI NOTE architecture section ---------- */
function setAinoteLayerDetail(key) {
  const box = $("#ainoteLayerDetail");
  if (!box) return;
  const html = ARCH_LAYER_HINT[key];
  box.innerHTML = html ? `<p>${html}</p><p class="ainote-hint">點同層卡片可開完整流程說明。</p>` : "<p>點上方任一層，看白話說明。</p>";
}

function setAinoteDiagramDetail(key, map) {
  const box = $("#ainoteDiagramDetail");
  if (!box) return;
  const d = map[key];
  if (!d) {
    box.innerHTML = "<h4>點上方方塊或流程節點</h4><p>這裡會顯示該步驟在 AI-NOTE01 裡對應哪個目錄／檔案，以及為什麼要獨立成引擎。</p>";
    return;
  }
  box.innerHTML = `<h4>${d.title}</h4><p>${d.body}</p><p class="ainote-hint"><strong>對應路徑：</strong><code>${d.path}</code></p>`;
}

function setAinoteFlowDetail(key) {
  const box = $("#ainoteFlowDetail");
  if (!box || !ARCH_FLOW[key]) return;
  const d = ARCH_FLOW[key];
  box.innerHTML = `<h4>${d.title}</h4><p>${d.body}</p><pre class="code-inline">${d.tip}</pre>`;
}

function initAinoteTabs() {
  const root = $("#ainoteTabs");
  if (!root) return;
  const tabs = $all(".tab-list button", root);
  const panels = $all(".tab-panel", root);
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const id = tab.dataset.tab;
      tabs.forEach((t) => t.setAttribute("aria-selected", String(t === tab)));
      panels.forEach((p) => p.classList.toggle("active", p.dataset.panel === id));
    });
  });
}

initAinoteTabs();
setAinoteLayerDetail(null);

$("#ainote")?.addEventListener("click", (e) => {
  const pop = e.target.closest("[data-arch-pop]");
  if (pop) {
    openLoopModal(pop.dataset.archPop);
    return;
  }
  const layer = e.target.closest(".ainote-layer");
  if (layer?.dataset.archPop) {
    $all(".ainote-layer").forEach((el) => el.classList.toggle("active", el === layer));
    setAinoteLayerDetail(layer.dataset.archPop);
    return;
  }
  const flow = e.target.closest("[data-arch-flow]");
  if (flow) {
    $all("#ainoteFlowBoard .flow-node").forEach((el) => el.classList.toggle("active", el === flow));
    setAinoteFlowDetail(flow.dataset.archFlow);
    return;
  }
  const sys = e.target.closest("[data-arch-sys]");
  if (sys) {
    const board = sys.closest("#ainoteSysBoard");
    if (board) {
      $all("#ainoteSysBoard .sketch-node").forEach((el) => el.classList.toggle("active", el === sys));
    }
    setAinoteDiagramDetail(sys.dataset.archSys, ARCH_SYS);
    return;
  }
  const logic = e.target.closest("[data-arch-logic]");
  if (logic) {
    $all("#ainoteLogicBoard .sketch-node").forEach((el) => el.classList.toggle("active", el === logic));
    setAinoteDiagramDetail(logic.dataset.archLogic, ARCH_LOGIC);
  }
});

$("#loopModalClose")?.addEventListener("click", closeLoopModal);
loopModal?.addEventListener("click", (e) => {
  if (e.target === loopModal) closeLoopModal();
});

/* ---------- section enter animation for glass cards ---------- */
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.transition = "opacity 0.5s ease, transform 0.5s ease";
        entry.target.style.opacity = "1";
        entry.target.style.transform = "translateY(0)";
      }
    });
  },
  { threshold: 0.12 }
);

$all(".section .glass, .section .panel, .kb-step, .api-card, .path-node, .tool-card, .loop-deck, .ainote-layer, .ainote-module, .ainote-tech, .sketch-sheet, .ainote-engine-card").forEach((el, i) => {
  if (el.closest(".hero")) return;
  el.style.opacity = "0";
  el.style.transform = "translateY(14px)";
  el.style.transitionDelay = `${(i % 6) * 0.04}s`;
  io.observe(el);
});

updateProgressUI();
