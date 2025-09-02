"use strict";

/**
 * 初始化应用入口
 * 小白解释：这就是程序的“main函数”，等页面加载完就会运行，负责绑按钮、加载题库、展示开始页。
 */
document.addEventListener("DOMContentLoaded", () => {
  const screens = {
    start: document.getElementById("screen-start"),
    exam: document.getElementById("screen-exam"),
    result: document.getElementById("screen-result"),
  };

  const btnStart = document.getElementById("btn-start");
  const btnPrev = document.getElementById("btn-prev");
  const btnNext = document.getElementById("btn-next");
  const btnNextUnanswered = document.getElementById("btn-next-unanswered");
  const btnSubmit = document.getElementById("btn-submit");
  const btnExport = document.getElementById("btn-export");
  const btnRestart = document.getElementById("btn-restart");

  const timerEl = document.getElementById("timer");
  const remainEl = document.getElementById("remaining-count");
  const navigatorEl = document.getElementById("navigator");
  const questionContainer = document.getElementById("question-container");
  const scoreEl = document.getElementById("score");
  const passTextEl = document.getElementById("pass-text");
  const answerReviewEl = document.getElementById("answer-review");

  const MD_PATH = "../题库.md"; // 顶层题库
  const STORAGE_KEY = "simpleExamStateV1";

  /**
   * 应用的运行时状态
   */
  const appState = {
    allQuestions: { single: [], multiple: [], judge: [] },
    paper: [], // 试卷题目序列
    answers: {}, // 用户答案：key=题目id, value=所选数组
    currentIndex: 0,
    timer: { totalSeconds: 90 * 60, leftSeconds: 90 * 60, intervalId: null },
  };

  /**
   * 显示指定页面
   */
  function showScreen(name) {
    Object.values(screens).forEach((sec) => sec.classList.remove("active"));
    screens[name].classList.add("active");
  }

  /**
   * 拉取并解析题库 Markdown
   * 小白解释：读 `题库.md` 文本，并解析成题目对象，分三类：单选、多选、判断。
   */
  async function loadQuestionBank() {
    const res = await fetch(MD_PATH);
    const text = await res.text();
    return parseMarkdownToQuestions(text);
  }

  /**
   * 解析 Markdown 为题目结构（增强容错）
   * 小白解释：题库可能写法不统一，这里用更宽松的正则，兼容全角冒号、不同括号、附加备注等。
   * - 单选/多选：匹配 A-D 选项，答案抓取多个字母（如 ABC）
   * - 判断：固定 A.对 / B.错，答案抓取 A 或 B
   */
  function parseMarkdownToQuestions(mdText) {
    const single = [];
    const multiple = [];
    const judge = [];

    const lines = mdText.split(/\r?\n/);
    let i = 0;
    let section = ""; // single | multiple | judge

    function pushQuestion(target, q) {
      if (!q || !q.title || !q.options || !q.answer) return;
      q.id = `${target}-${target.length + 1}-${Math.random().toString(36).slice(2, 7)}`;
      target.push(q);
    }

    while (i < lines.length) {
      const line = lines[i].trim();
      if (line.startsWith("### 一、单选题")) section = "single";
      if (line.startsWith("### 二、多选题")) section = "multiple";
      if (line.startsWith("### 三、判断题")) section = "judge";

      const qMatch = line.match(/^(\d+)\.\s+(.*)$/);
      if (qMatch && (section === "single" || section === "multiple")) {
        const title = qMatch[2].replace(/\s+$/,'');
        const opts = [];
        let j = i + 1;
        while (j < lines.length && /^\s*[A-D]\.\s/.test(lines[j])) {
          const optText = lines[j].trim().replace(/^([A-D])\.\s*/, (m, g1) => `${g1}. `);
          opts.push(optText);
          j++;
        }
        const answerLine = (lines[j] || "").replace(/\s+/g, " ");
        // 兼容：参考答案: ABC、参考答案：ABC、【参考答案】: ABC、【参考答案】：ABC、【参考答案】: ABC (备注)
        const ansMatch = answerLine.match(/参考答案[^:：]*[:：]\s*([A-D]{1,4})/);
        const right = ansMatch ? ansMatch[1].trim().split("") : [];
        const q = { type: section, title, options: opts, answer: right };
        pushQuestion(section === "single" ? single : multiple, q);
        i = j + 1;
        continue;
      }

      if (qMatch && section === "judge") {
        const title = qMatch[2];
        // 跳过 A/B 行直到答案
        let j = i + 1;
        while (j < lines.length && !/参考答案/.test(lines[j])) j++;
        const lineAns = lines[j] || "";
        const ansMatch = lineAns.match(/参考答案[^:：]*[:：]\s*([AB])/);
        const right = ansMatch ? [ansMatch[1]] : [];
        const q = { type: "judge", title, options: ["A. 对", "B. 错"], answer: right };
        pushQuestion(judge, q);
        i = j + 1;
        continue;
      }

      i++;
    }

    return { single, multiple, judge };
  }

  /**
   * 根据 PRD 生成试卷，题目不足时循环复用，保证大致均匀
   * 顺序要求：先单选50题 → 判断20题 → 多选20题（各自内部随机）
   */
  function generatePaper(all) {
    const need = { single: 50, judge: 20, multiple: 20 };
    const per = { single: 1, judge: 1, multiple: 1.5 };
    const paper = [];
    ["single", "judge", "multiple"].forEach((k) => {
      const src = all[k];
      if (!src.length) return;
      // 打散
      const shuffled = [...src].sort(() => Math.random() - 0.5);
      for (let idx = 0; idx < need[k]; idx++) {
        const q = JSON.parse(JSON.stringify(shuffled[idx % shuffled.length]));
        q.score = per[k];
        paper.push(q);
      }
    });
    // 不整体打乱，保持“单选→判断→多选”的大顺序
    return paper;
  }

  /** 渲染导航与剩余数量 */
  function renderNavigator() {
    const total = appState.paper.length;
    const answered = Object.keys(appState.answers).length;
    remainEl.textContent = String(total - answered);
    const grid = document.createElement("div");
    grid.className = "nav-grid";
    // 分段标记：1、51、71
    function appendSectionLabel(text){
      const sec = document.createElement("div");
      sec.className = "nav-section";
      sec.textContent = text;
      grid.appendChild(sec);
    }
    appendSectionLabel("单选题 1-50");
    appState.paper.forEach((q, idx) => {
      if (idx === 50) appendSectionLabel("判断题 51-70");
      if (idx === 70) appendSectionLabel("多选题 71-90");
      const item = document.createElement("div");
      item.className = "nav-item" + (appState.answers[idx] ? " answered" : "") + (idx === appState.currentIndex ? " current" : "");
      item.textContent = String(idx + 1);
      item.addEventListener("click", () => {
        appState.currentIndex = idx;
        renderQuestion();
        renderNavigator();
        saveState();
      });
      grid.appendChild(item);
    });
    navigatorEl.innerHTML = "";
    navigatorEl.appendChild(grid);
  }

  /** 渲染当前题目 */
  function renderQuestion() {
    const q = appState.paper[appState.currentIndex];
    if (!q) return;
    const userSel = appState.answers[appState.currentIndex] || [];
    const card = document.createElement("div");
    card.className = "question-card";
    const title = document.createElement("h3");
    title.className = "question-title";
    title.textContent = `第${appState.currentIndex + 1}题（${labelOf(q.type)}） ${q.title}`;
    const opts = document.createElement("div");
    opts.className = "options";
    q.options.forEach((opt) => {
      const key = opt.slice(0, 1); // A/B/C/D
      const id = `q${appState.currentIndex}-${key}`;
      const input = document.createElement("input");
      input.type = q.type === "multiple" ? "checkbox" : "radio";
      input.name = `q-${appState.currentIndex}`;
      input.id = id;
      input.value = key;
      input.checked = userSel.includes(key);
      input.addEventListener("change", () => onSelectOption(q, key, input.checked));
      const label = document.createElement("label");
      label.setAttribute("for", id);
      label.textContent = opt;
      const row = document.createElement("div");
      row.appendChild(input);
      row.appendChild(label);
      opts.appendChild(row);
    });
    card.appendChild(title);
    card.appendChild(opts);
    questionContainer.innerHTML = "";
    questionContainer.appendChild(card);
  }

  /** 获取中文题型标签 */
  function labelOf(type) {
    return type === "single" ? "单选" : type === "multiple" ? "多选" : "判断";
  }

  /** 处理选项选择 */
  function onSelectOption(q, key, checked) {
    const idx = appState.currentIndex;
    const prev = appState.answers[idx] || [];
    let next;
    if (q.type === "multiple") {
      next = checked ? Array.from(new Set([...prev, key])) : prev.filter((k) => k !== key);
    } else {
      next = checked ? [key] : [];
    }
    appState.answers[idx] = next;
    renderNavigator();
    saveState();
  }

  /** 计时器控制 */
  function startTimer() {
    updateTimerText();
    appState.timer.intervalId = setInterval(() => {
      appState.timer.leftSeconds -= 1;
      updateTimerText();
      if (appState.timer.leftSeconds % 5 === 0) saveState();
      if (appState.timer.leftSeconds <= 0) {
        clearInterval(appState.timer.intervalId);
        submitPaper();
      }
    }, 1000);
  }
  function updateTimerText() {
    const m = Math.floor(appState.timer.leftSeconds / 60)
      .toString()
      .padStart(2, "0");
    const s = Math.floor(appState.timer.leftSeconds % 60)
      .toString()
      .padStart(2, "0");
    timerEl.textContent = `${m}:${s}`;
  }

  /** 计算成绩 */
  function calcScore() {
    let score = 0;
    const detail = [];
    appState.paper.forEach((q, idx) => {
      const sel = (appState.answers[idx] || []).slice().sort();
      const ans = q.answer.slice().sort();
      const ok = sel.length > 0 && sel.join("") === ans.join("");
      if (ok) score += q.score;
      detail.push({ idx, ok, correct: ans, chosen: sel, q });
    });
    return { score: Math.round(score * 100) / 100, detail };
  }

  /** 提交试卷并展示结果 */
  function submitPaper() {
    const total = appState.paper.length;
    const unanswered = total - Object.keys(appState.answers).length;
    if (unanswered > 0) {
      const ok = confirm(`还有 ${unanswered} 题未作答，确定要提交吗？`);
      if (!ok) return;
    }
    const { score, detail } = calcScore();
    scoreEl.textContent = String(score);
    passTextEl.textContent = score >= 60 ? "恭喜通过考试" : "继续加油";
    // 结果复盘
    answerReviewEl.innerHTML = detail
      .map((d) => {
        const prefix = d.ok ? "✅" : "❌";
        return `<div class="card"><div>${prefix} 第${d.idx + 1}题（${labelOf(d.q.type)}）${escapeHtml(
          d.q.title
        )}</div><div>正确答案：${d.correct.join("") || "-"}；你的答案：${d.chosen.join("") || "未作答"}</div></div>`;
      })
      .join("");
    showScreen("result");
    clearInterval(appState.timer.intervalId);
    localStorage.removeItem(STORAGE_KEY);
  }

  /**
   * 导出错题为真正的 .docx 文档
   * 小白解释：用 docx 库拼一个 Word 文档，每个错题写成段落。
   */
  async function exportWrongAsDocx() {
    const { detail } = calcScore();
    const wrong = detail.filter((d) => !d.ok);
    if (!wrong.length) {
      // 没有错题也导出一个空文档提示
      await buildAndDownloadDocx([{ type: "title", text: "错题集" }, { type: "p", text: "恭喜，没有错题！" }]);
      return;
    }
    const blocks = [{ type: "title", text: "错题集" }];
    wrong.forEach((d, i) => {
      blocks.push({ type: "h2", text: `错题 ${i + 1}` });
      blocks.push({ type: "p", text: d.q.title });
      blocks.push({ type: "p", text: `正确答案：${d.correct.join("") || "-"}` });
      blocks.push({ type: "p", text: `你的答案：${d.chosen.join("") || "未作答"}` });
    });
    await buildAndDownloadDocx(blocks);
  }

  /** 使用 docx 库生成并下载 .docx */
  async function buildAndDownloadDocx(blocks) {
    const { Document, Packer, Paragraph, HeadingLevel } = window.docx || {};
    if (!Document) {
      alert("docx 库未加载，稍后重试或检查网络");
      return;
    }
    const paragraphs = blocks.map((b) => {
      if (b.type === "title") return new Paragraph({ text: b.text, heading: HeadingLevel.TITLE });
      if (b.type === "h2") return new Paragraph({ text: b.text, heading: HeadingLevel.HEADING_2 });
      return new Paragraph({ text: b.text });
    });
    const doc = new Document({ sections: [{ properties: {}, children: paragraphs }] });
    const blob = await Packer.toBlob(doc);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "错题集.docx";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  /** HTML 转义 */
  function escapeHtml(s) {
    return s
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  // 事件绑定
  btnStart.addEventListener("click", async () => {
    const bank = await loadQuestionBank();
    appState.allQuestions = bank;
    appState.paper = generatePaper(bank);
    appState.answers = {};
    appState.currentIndex = 0;
    appState.timer = { totalSeconds: 90 * 60, leftSeconds: 90 * 60, intervalId: null };
    renderQuestion();
    renderNavigator();
    startTimer();
    showScreen("exam");
  });

  btnPrev.addEventListener("click", () => {
    appState.currentIndex = Math.max(0, appState.currentIndex - 1);
    renderQuestion();
    renderNavigator();
    saveState();
  });
  btnNext.addEventListener("click", () => {
    appState.currentIndex = Math.min(appState.paper.length - 1, appState.currentIndex + 1);
    renderQuestion();
    renderNavigator();
    saveState();
  });
  btnNextUnanswered?.addEventListener("click", () => {
    const total = appState.paper.length;
    let i = appState.currentIndex + 1;
    for (let k = 0; k < total; k++) {
      const idx = (i + k) % total;
      if (!appState.answers[idx] || appState.answers[idx].length === 0) {
        appState.currentIndex = idx;
        renderQuestion();
        renderNavigator();
        saveState();
        return;
      }
    }
    alert("已无未答题");
  });
  btnSubmit.addEventListener("click", submitPaper);
  btnRestart.addEventListener("click", () => window.location.reload());
  btnExport.addEventListener("click", exportWrongAsDocx);
  
  /**
   * 保存/恢复进度（localStorage）
   * 小白解释：把题目、答案、当前题号和剩余时间存到浏览器本地，下次刷新可接着答。
   */
  function saveState() {
    if (!appState.paper.length) return;
    const toSave = {
      paper: appState.paper,
      answers: appState.answers,
      currentIndex: appState.currentIndex,
      leftSeconds: appState.timer.leftSeconds,
      ts: Date.now(),
    };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave)); } catch {}
  }
  function tryRestoreState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (!data.paper || !Array.isArray(data.paper)) return false;
      const resume = confirm("检测到未完成的考试，是否继续上次进度？");
      if (!resume) { localStorage.removeItem(STORAGE_KEY); return false; }
      appState.paper = data.paper;
      appState.answers = data.answers || {};
      appState.currentIndex = Number.isInteger(data.currentIndex) ? data.currentIndex : 0;
      appState.timer.leftSeconds = typeof data.leftSeconds === "number" ? data.leftSeconds : 90*60;
      renderQuestion();
      renderNavigator();
      startTimer();
      showScreen("exam");
      return true;
    } catch { return false; }
  }

  // 页面加载后，优先尝试恢复进度
  if (!tryRestoreState()) {
    // 等待用户点击“开始答题”再组卷
  }
});


