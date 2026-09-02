# AI Build Lab

互動式教學展示網站：用 AI 做出你想要的程式／網站。

**作者：** 李孟霖  
**聯絡：** nh17528@ntbna.gov.tw

## 主題（約 60–70 分鐘）

1. 構想與規劃
2. 流程圖
3. SPEC
4. PROMPT
5. API 細節
6. 知識庫與 Markdown（切塊、指令、檢驗對接、合格標準）
7. RAG／生成參數調校
8. 實戰案例：TP NOTE01、北區國稅局 TP 可比篩選器
9. **AI NOTE 架構解說**：引擎＋模組、實機目錄（tp_reasoning / translation_engine / deident_engine…）、架構＋邏輯流程圖
10. 總結：RAG 問答流程
11. HOOK · MCP · Subagent · 如何建立 Workflow
12. AI 回饋迴路（錯誤可被發現、分類、量化、修正）
13. SPEC／PROMPT 工坊
14. **LLM 進階分頁**（`llm.html`）：Token → Transformer／Attention → 機率；Context／Temperature／Top-K／Top-P／Reranker／Fine-tuning（含動態圖解）

## 使用方式

用瀏覽器直接開啟 `index.html`，或：

```bash
npx --yes serve .
```

進階說明另開：`llm.html`

## 投影片全螢幕模式

- 點右上角「投影片模式」、首頁「投影片全螢幕」，或按 **P**
- 翻頁：← →、空白鍵、PageUp／PageDown
- 在「回饋迴路」分區，方向鍵會先翻完 8 張內頁
- **F**：瀏覽器全螢幕；**Esc**：離開投影片模式

## 互動重點

- 點流程圖節點、參數列、API 卡片可展開說明
- PROMPT 可逐層點選組裝
- 知識庫可對照好切／壞切、複製驗收指令、勾選合格清單
- 協作區可點 HOOK／MCP／Subagent／Workflow，以及建立工作流的 7 步
- 案例區可切換目的／流程／SPEC／PROMPT／知識庫地圖／參數落地
- **09 AI NOTE 架構**：五層架構、**九大實機引擎目錄**、**系統架構圖＋邏輯流程圖**、RAG 管線、開發流程；名詞可點開小百科
- 「套用建議組態」顯示教室預設參數
- 回饋迴路 8 張投影片：Tesla、股票型態、錯誤即資料、發票、風險案件、統計抽驗