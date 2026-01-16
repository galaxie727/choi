/* ============================
   チーと言えばギュウと答える
   app.js v0.30.6 (fix pack 308)
   ============================ */

(() => {
  "use strict";

  /* ===== VERSION ===== */
  const APP_VERSION = "v0.30.6";
  const versionEl = document.getElementById("versionVal");
  if (versionEl) versionEl.textContent = APP_VERSION;

  /* ===== URL params ===== */
  const params = new URLSearchParams(location.search);
  const DEBUG = params.get("debug") === "1";

  /* ===== storage keys ===== */
  const CHEE_RECORD_KEY = "cheeGirlBestStage";      // チー娘モード BEST
  const GIRL_KEY = "selectedGirlKey";               // A/B/C...
  const STAR_KEY = "chiGiftedViewed";               // gifted閲覧済み (json)

  const getBestStage = () => Number(localStorage.getItem(CHEE_RECORD_KEY) || "0");
  const setBestStage = (v) => localStorage.setItem(CHEE_RECORD_KEY, String(v));
  const getSavedGirl = () => localStorage.getItem(GIRL_KEY) || "A";
  const saveGirl = (g) => localStorage.setItem(GIRL_KEY, g);

  const getStarMap = () => {
    try { return JSON.parse(localStorage.getItem(STAR_KEY) || "{}"); }
    catch { return {}; }
  };
  const setStar = (g) => {
    const m = getStarMap();
    m[g] = true;
    localStorage.setItem(STAR_KEY, JSON.stringify(m));
  };

  /* ===== DOM refs ===== */
  const counterEl = document.getElementById("counter");

  const screens = {
    top: document.getElementById("topScreen"),
    girl: document.getElementById("girlScreen"),
    mode: document.getElementById("modeScreen"),
    game: document.getElementById("gameScreen"),
  };

  const btnGoGirl = document.getElementById("btnGoGirl");
  const btnGirlBack = document.getElementById("btnGirlBack");
  const btnGoMode = document.getElementById("btnGoMode");

  const btnModeBack = document.getElementById("btnModeBack");
  const btnStartQuiz = document.getElementById("btnStartQuiz");
  const btnStartChee = document.getElementById("btnStartChee");

  const bestLine = document.getElementById("bestLine");

  const girlGrid = document.getElementById("girlGrid");

  const qEl = document.getElementById("question");
  const speechEl = document.getElementById("speech");
  const choicesEl = document.getElementById("choices");

  const gaugeWrap = document.getElementById("gaugeWrap");
  const gaugeBar = document.getElementById("gaugeBar");

  const resultBox = document.getElementById("resultBox");
  const resultPct = document.getElementById("resultPct");

  /* ===== inject CSS for shake + banner (HTMLいじらなくてOK) ===== */
  const style = document.createElement("style");
  style.textContent = `
    @keyframes screenShake {
      0%{ transform:translate3d(0,0,0) }
      15%{ transform:translate3d(-2px,1px,0) }
      30%{ transform:translate3d(2px,-1px,0) }
      45%{ transform:translate3d(-3px,0,0) }
      60%{ transform:translate3d(3px,1px,0) }
      75%{ transform:translate3d(-2px,-1px,0) }
      100%{ transform:translate3d(0,0,0) }
    }
    .shakeNow{ animation:screenShake .35s linear 1; }
    .chiBanner{
      position:absolute; left:16px; right:16px; top:110px;
      z-index:30;
      padding:14px 14px;
      border-radius:14px;
      background:rgba(0,0,0,.40);
      border:1px solid rgba(255,255,255,.20);
      font-weight:900;
      letter-spacing:.14em;
      text-align:center;
      text-shadow:0 10px 28px rgba(0,0,0,.75);
      opacity:0;
      transform:translateY(10px);
      transition:opacity .18s ease, transform .18s ease;
      pointer-events:none;
    }
    .chiBanner.show{
      opacity:1;
      transform:translateY(0);
    }
  `;
  document.head.appendChild(style);

  const chiBanner = document.createElement("div");
  chiBanner.className = "chiBanner";
  chiBanner.textContent = "";
  // game screen にぶら下げ
  if (screens.game) screens.game.appendChild(chiBanner);

  /* ===== image helpers ===== */
  const bgEls = {
    top: screens.top?.querySelector(".bg"),
    girl: screens.girl?.querySelector(".bg"),
    mode: screens.mode?.querySelector(".bg"),
    game: screens.game?.querySelector(".bg"),
  };

  // iPhoneで軽くするため decode() を使ってから背景に反映
  async function setBg(el, url) {
    if (!el) return;
    if (!url) { el.style.backgroundImage = ""; return; }
    try {
      const img = new Image();
      img.src = url;
      // decodeが無いブラウザでもOK
      if (img.decode) await img.decode();
      el.style.backgroundImage = `url("${url}")`;
    } catch {
      // decode失敗でも表示は試す
      el.style.backgroundImage = `url("${url}")`;
    }
  }

  /* ===== girls data =====
     D/E/F は icon と top しか無い → locked扱い（DEBUG=1で解除可）
  */
  function makeGirl(prefix, key, name, locked) {
    return {
      key,
      name,
      locked,
      icon: `${prefix}_icon.png`,
      top: `${prefix}_top_01.png`,
      normal: Array.from({ length: 15 }, (_, i) => `${prefix}_normal_${String(i + 1).padStart(2, "0")}.png`),
      clear: Array.from({ length: 3 }, (_, i) => `${prefix}_clear_${String(i + 1).padStart(2, "0")}.png`),
      gameover: `${prefix}_gameover_01.png`,
      chiGameover: `${prefix}_chi_gameover_01.png`,
      score: {
        s: Array.from({ length: 3 }, (_, i) => `${prefix}_score_s_${String(i + 1).padStart(2, "0")}.png`),
        a: Array.from({ length: 3 }, (_, i) => `${prefix}_score_a_${String(i + 1).padStart(2, "0")}.png`),
        b: Array.from({ length: 3 }, (_, i) => `${prefix}_score_b_${String(i + 1).padStart(2, "0")}.png`),
        c: Array.from({ length: 3 }, (_, i) => `${prefix}_score_c_${String(i + 1).padStart(2, "0")}.png`),
        d: Array.from({ length: 3 }, (_, i) => `${prefix}_score_d_${String(i + 1).padStart(2, "0")}.png`),
      }
    };
  }

  const GIRLS = [
    makeGirl("girlA", "A", "Girl A", false),
    makeGirl("girlB", "B", "Girl B", false),
    makeGirl("girlC", "C", "Girl C", false),
    makeGirl("girlD", "D", "Girl D", true),
    makeGirl("girlE", "E", "Girl E", true),
    makeGirl("girlF", "F", "Girl F", true),
  ];

  const getGirl = (key) => GIRLS.find(g => g.key === key) || GIRLS[0];

  function isUnlocked(g) {
    return DEBUG ? true : !g.locked;
  }

  /* ===== screens ===== */
  function showScreen(name) {
    Object.entries(screens).forEach(([k, el]) => {
      if (!el) return;
      if (k === name) el.classList.remove("hide");
      else el.classList.add("hide");
    });
  }

  /* ===== gauge control ===== */
  let gaugeTimer = null;

  function hideGauge() {
    if (gaugeTimer) {
      clearInterval(gaugeTimer);
      gaugeTimer = null;
    }
    gaugeWrap?.classList.remove("show");
    if (gaugeBar) gaugeBar.style.transform = "scaleX(0)";
  }

  // durationMs: 全体時間
  function runGauge(durationMs, color, onTimeout) {
    hideGauge();

    if (!gaugeWrap || !gaugeBar) return;
    gaugeWrap.classList.add("show");
    gaugeBar.className = "";
    gaugeBar.classList.add(color);
    gaugeBar.style.transform = "scaleX(1)";

    const start = performance.now();
    gaugeTimer = setInterval(() => {
      const t = performance.now();
      const p = Math.max(0, 1 - (t - start) / durationMs);
      gaugeBar.style.transform = `scaleX(${p})`;
      if (p <= 0) {
        hideGauge();
        onTimeout?.();
      }
    }, 16);
  }

  /* ===== banner ===== */
  let bannerTimer = null;
  function showChiBanner(text, ms = 900) {
    if (!chiBanner) return Promise.resolve();
    if (bannerTimer) clearTimeout(bannerTimer);
    chiBanner.textContent = text;
    // 次フレームで show → iPhoneでも確実に出す
    requestAnimationFrame(() => {
      chiBanner.classList.add("show");
    });
    return new Promise((resolve) => {
      bannerTimer = setTimeout(() => {
        chiBanner.classList.remove("show");
        resolve();
      }, ms);
    });
  }

  /* ===== choices ===== */
  function setChoices(labels, onPick, disabled = false) {
    if (!choicesEl) return;
    choicesEl.innerHTML = "";
    labels.forEach((t) => {
      const b = document.createElement("button");
      b.className = "choice";
      b.textContent = t;
      b.style.background = "rgba(255,255,255,.22)";
      b.disabled = disabled;
      b.addEventListener("click", () => onPick(t), { passive: true });
      choicesEl.appendChild(b);
    });
  }

  function lockChoices(lock) {
    if (!choicesEl) return;
    choicesEl.querySelectorAll("button.choice").forEach(btn => btn.disabled = lock);
  }

  /* ===== quiz questions ===== */
  // Q1/Q25固定。間は雰囲気で25問にしてある（後で差し替えOK）
  const Q1 = "あなたはチー牛ですか？";
  const Q25 = "最後にひとこと。チーと言えば？";

  const MID = [
    "知らない人を見て「チー牛かも」と思ってしまったことはありますか？",
    "チーズ牛丼を本当は食べたいのに、恥ずかしくて頼めないですか？",
    "友人にチー牛はいますか？",
    "大谷翔平選手に言ってほしい言葉1位は「チー牛食おうぜ！」だと思いますか？",
    "麻雀でチーをされた瞬間に「ギュウ」と答えると取り消せる「チーギュウ返し」がある。本当だと思いますか？",
    "あなたは三度の飯よりチー牛が好きって本当ですか？",
    "チー牛の呼吸（全十ノ型）があると思いますか？",
    "「チーと言えばギュウ」「ギュウと言えばチー」を口にしたことはありますか？",
    "チー牛を見かけると一瞬だけ目で追ってしまいますか？",
    "今日の気分は「チー」ですか？",
    "今日の気分は「ギュウ」ですか？",
    "「はい」と答えると楽になることが多いですか？",
    "「いいえ」と答えると強くなった気がしますか？",
    "チー牛診断を何回も回したいタイプですか？",
    "今この瞬間、ギュウって言いたいですか？",
    "一度でも「チー娘」に会いたいと思いましたか？",
    "チー牛という言葉を検索したことがありますか？",
    "突然のギュウに耐性がありますか？",
    "選択肢の中で「ギュウ」が一番安心しますか？",
    "最後はどうせギュウだと思ってますか？",
    "ここまで来たらギュウと言うしかないですか？",
    "チーと言われたら反射でギュウが出ますか？",
    "あなたの中にチーがいますか？",
  ];

  function build25() {
    const mid = MID.slice(0, 23); // 1 + 23 + 1 = 25
    return [Q1, ...mid, Q25];
  }

  /* ===== state ===== */
  const state = {
    girlKey: getSavedGirl(),
    mode: null,             // "quiz" | "chee"
    qIndex: 0,
    questions: [],
    counts: { "はい": 0, "いいえ": 0, "チー": 0, "ギュウ": 0 },
    inBattle: false,        // チー娘戦中
    battleLv: 0,            // 診断モード乱入 Lv1..3
    battleDone: 0,          // 診断モード乱入回数
    battlePlan: [],         // 乱入する問題番号(1-based)
    cheeStage: 1,           // チー娘モードのステージ
    cheeBest: getBestStage(),
  };

  function updateCounter(text) {
    if (!counterEl) return;
    counterEl.textContent = text || "-";
  }

  /* ===== scoring (簡易) ===== */
  // ここは後であなたの例外点数に差し替えOK。今は雰囲気だけ。
  function calcPct() {
    const vals = Object.values(state.counts);
    const max = Math.max(...vals);
    const min = Math.min(...vals);
    const diff = max - min;
    // diffが小さいほど高い（あなたの仕様）
    const pct = Math.max(0, Math.min(100, 100 - diff * 8));
    return pct;
  }

  function pickRank(pct) {
    if (pct >= 85) return "s";
    if (pct >= 70) return "a";
    if (pct >= 55) return "b";
    if (pct >= 40) return "c";
    return "d";
  }

  function rand(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  /* ===== background selection ===== */
  function getTopBg() {
    // あなたのリポに top_keyvisual_01.png がある前提
    return "top_keyvisual_01.png";
  }

  async function applyCommonBg() {
    await setBg(bgEls.top, getTopBg());
    await setBg(bgEls.girl, getTopBg());
    await setBg(bgEls.mode, getGirl(state.girlKey).top);
  }

  /* ===== girl select UI ===== */
  function renderGirlGrid() {
    if (!girlGrid) return;
    girlGrid.innerHTML = "";

    const starMap = getStarMap();
    const selected = state.girlKey;

    GIRLS.forEach(g => {
      const tile = document.createElement("div");
      tile.className = "girlTile";
      if (g.key === selected) tile.classList.add("active");
      if (!isUnlocked(g)) tile.classList.add("locked");

      const icon = document.createElement("div");
      icon.className = "iconBox";
      const img = document.createElement("img");
      img.src = g.icon;
      img.alt = g.name;
      icon.appendChild(img);

      const nm = document.createElement("div");
      nm.className = "girlName";

      // star = gifted閲覧済み
      const star = starMap[g.key] ? " ★" : "";
      nm.textContent = `${g.name}${star}`;

      tile.appendChild(icon);
      tile.appendChild(nm);

      if (!isUnlocked(g)) {
        const lock = document.createElement("div");
        lock.className = "lockBadge";
        lock.textContent = "LOCK";
        tile.appendChild(lock);
      }

      tile.addEventListener("click", () => {
        if (!isUnlocked(g)) return; // ロックは押しても変えない
        state.girlKey = g.key;
        saveGirl(g.key);
        renderGirlGrid();
      }, { passive: true });

      girlGrid.appendChild(tile);
    });
  }

  /* ===== game rendering ===== */
  async function showQuestion() {
    state.inBattle = false;
    hideGauge();
    speechEl.textContent = "";
    lockChoices(false);

    const g = getGirl(state.girlKey);

    // 画像：通常問題は normal を回す
    const qn = state.qIndex + 1;
    const normalImg = g.normal[(qn - 1) % g.normal.length];
    await setBg(bgEls.game, normalImg);

    // 文章
    qEl.textContent = state.questions[state.qIndex];

    // カウンタ
    updateCounter(`${qn}/25`);

    // 選択肢
    setChoices(["いいえ", "はい", "ギュウ", "チー"], (pick) => {
      onAnswer(pick);
    });
  }

  function planInvasions() {
    // 乱入が必ず見えるように、固定で 7,14,21 にする（Q1/Q25以外）
    // 乱入Lvは 1,2,3 の順に割り当て
    state.battlePlan = [7, 14, 21];
    state.battleDone = 0;
    state.battleLv = 0;
  }

  async function onAnswer(pick) {
    // 連打防止
    lockChoices(true);

    // カウント（診断モードのみ集計対象。チー娘モードは別）
    if (state.mode === "quiz") {
      if (state.counts[pick] != null) state.counts[pick] += 1;
    }

    // Q25は「ギュウ以外即ゲームオーバー」
    if (state.mode === "quiz" && state.qIndex === 24) {
      if (pick !== "ギュウ") {
        await showGameOver(false);
        return;
      }
      await showClearAndScore();
      return;
    }

    // 乱入判定（診断モードだけ）
    if (state.mode === "quiz") {
      const qn = state.qIndex + 1;
      // 次の問題に進む前に、指定ポイントなら乱入
      // （今のQが終わった直後に乱入を挟む）
      if (state.battlePlan.includes(qn) && state.battleDone < 3) {
        state.battleDone += 1;
        state.battleLv = state.battleDone; // 1→2→3
        await startInvasionBattle(state.battleLv);
        // 乱入が終わったら“次の問題へ”
        state.qIndex += 1;
        await showQuestion();
        return;
      }
    }

    // 通常：次へ
    state.qIndex += 1;
    await showQuestion();
  }

  /* ===== chi battle (quiz invasion) ===== */
  function battleTimeByLv(lv) {
    if (lv <= 1) return 1500;
    if (lv === 2) return 1100;
    return 850; // Lv3
  }

  async function startInvasionBattle(lv) {
    state.inBattle = true;

    // 「チー娘登場」必ず見せる
    await showChiBanner("チー娘登場", 900);

    // 背景は top に寄せて “乱入感”
    await setBg(bgEls.game, getGirl(state.girlKey).top);

    qEl.textContent = `チー娘 Lv${lv}\n「チーと言えば？」`;
    speechEl.textContent = "";

    setChoices(["いいえ", "はい", "ギュウ", "チー"], async (pick) => {
      if (!state.inBattle) return;
      state.inBattle = false;
      hideGauge();

      if (pick === "ギュウ") {
        // 成功 → 一瞬だけ「ギュウ」
        speechEl.textContent = "ギュウ";
        await wait(380);
        speechEl.textContent = "";
      } else {
        await showGameOver(true);
      }
    });

    // ゲージ開始（チー娘戦だけ）
    const ms = battleTimeByLv(lv);
    runGauge(ms, lv >= 3 ? "red" : "yellow", async () => {
      if (!state.inBattle) return;
      state.inBattle = false;
      await showGameOver(true);
    });

    // Lv3は軽く揺らす（1回）
    if (lv >= 3) shakeOnce();
  }

  /* ===== chee mode ===== */
  async function startCheeMode() {
    state.mode = "chee";
    state.cheeStage = 1;
    state.inBattle = true;

    showScreen("game");
    await setBg(bgEls.game, getGirl(state.girlKey).top);
    updateCounter("STAGE 1");
    await showChiBanner("チー娘モード", 900);

    await runCheeStage();
  }

  function stageTime(stage) {
    // ステージが上がるほど短い
    return Math.max(450, 1400 - stage * 85);
  }

  async function runCheeStage() {
    const st = state.cheeStage;
    state.inBattle = true;

    updateCounter(`STAGE ${st}`);
    qEl.textContent = `ステージ ${st}\n「チーと言えば？」`;
    speechEl.textContent = "";

    // Lv3以上は常に震える（毎ステージ開始時に1回）
    if (st >= 3) shakeOnce();

    setChoices(["いいえ", "はい", "ギュウ", "チー"], async (pick) => {
      if (!state.inBattle) return;
      state.inBattle = false;
      hideGauge();

      if (pick === "ギュウ") {
        speechEl.textContent = "ギュウ";
        // BEST更新
        if (st > state.cheeBest) {
          state.cheeBest = st;
          setBestStage(st);
        }
        await wait(220);

        state.cheeStage += 1;
        await runCheeStage();
      } else {
        await showCheeGameOver(st);
      }
    });

    // 「チー娘登場」が見えない対策：各ステージでも一瞬見せる（短め）
    // ただし毎回長いとテンポ悪いので 420ms
    await showChiBanner(`チー娘 Lv${Math.min(3, st)}`, 420);

    runGauge(stageTime(st), st >= 3 ? "red" : "yellow", async () => {
      if (!state.inBattle) return;
      state.inBattle = false;
      await showCheeGameOver(st);
    });
  }

  /* ===== gameover / clear ===== */
  async function showGameOver(isChi) {
    // 診断モードの通常ゲームオーバー
    hideGauge();
    lockChoices(true);
    updateCounter("GAME OVER");

    const g = getGirl(state.girlKey);
    const img = isChi ? g.chiGameover : g.gameover;
    await setBg(bgEls.game, img);

    qEl.textContent = "GAME OVER";
    speechEl.textContent = "";
    setChoices(["TOPへ戻る"], async () => {
      await goTop();
    });
  }

  async function showCheeGameOver(stage) {
    hideGauge();
    lockChoices(true);
    updateCounter("GAME OVER");

    const g = getGirl(state.girlKey);
    await setBg(bgEls.game, g.chiGameover || g.gameover);

    qEl.textContent = `GAME OVER\n到達ステージ：${stage}\nBEST：${Math.max(getBestStage(), stage)}`;
    speechEl.textContent = "";
    setChoices(["もう一回", "TOPへ"], async (pick) => {
      if (pick === "もう一回") {
        await startCheeMode();
      } else {
        await goTop();
      }
    });
  }

  async function showClearAndScore() {
    hideGauge();
    lockChoices(true);

    const g = getGirl(state.girlKey);

    // 2% gifted
    const gifted = Math.random() < 0.02;
    if (gifted) setStar(g.key);

    // 背景
    await setBg(bgEls.game, rand(g.clear));

    const pct = gifted ? 100 : calcPct();
    const rank = gifted ? "s" : pickRank(pct);

    // クリア文章
    qEl.textContent = gifted ? "チー牛ギフテッド（チギュテッド）" : "診断結果";
    speechEl.textContent = "";

    // スコア演出
    if (resultBox && resultPct) {
      resultBox.classList.remove("hide");
      animatePct(pct);
    }

    // ランク画像（あれば）
    const rankImg = g.score?.[rank]?.length ? rand(g.score[rank]) : null;
    if (rankImg) await setBg(bgEls.game, rankImg);

    setChoices(["TOPへ戻る"], async () => {
      if (resultBox) resultBox.classList.add("hide");
      await goTop();
    });
  }

  function animatePct(target) {
    const el = resultPct;
    if (!el) return;
    let cur = 0;
    const start = performance.now();
    const dur = 800;
    const tick = () => {
      const t = performance.now();
      const p = Math.min(1, (t - start) / dur);
      cur = Math.floor(target * p);
      el.innerHTML = `${cur}<small>%</small>`;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function shakeOnce() {
    const el = screens.game;
    if (!el) return;
    el.classList.remove("shakeNow");
    // 次フレームで付与→必ず発火
    requestAnimationFrame(() => {
      el.classList.add("shakeNow");
      setTimeout(() => el.classList.remove("shakeNow"), 420);
    });
  }

  function wait(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  /* ===== mode start ===== */
  async function startQuiz() {
    state.mode = "quiz";
    state.qIndex = 0;
    state.questions = build25();
    state.counts = { "はい": 0, "いいえ": 0, "チー": 0, "ギュウ": 0 };
    planInvasions();

    if (resultBox) resultBox.classList.add("hide");

    showScreen("game");
    await setBg(bgEls.game, getGirl(state.girlKey).normal[0]);
    await showQuestion();
  }

  /* ===== nav ===== */
  async function goTop() {
    hideGauge();
    state.inBattle = false;
    updateCounter("-");
    showScreen("top");
    await setBg(bgEls.top, getTopBg());
  }

  function updateBestLine() {
    if (!bestLine) return;
    bestLine.textContent = `チー娘 BEST：ステージ${getBestStage()}`;
  }

  /* ===== buttons ===== */
  btnGoGirl?.addEventListener("click", async () => {
    await applyCommonBg();
    renderGirlGrid();
    showScreen("girl");
  }, { passive: true });

  btnGirlBack?.addEventListener("click", async () => {
    await goTop();
  }, { passive: true });

  btnGoMode?.addEventListener("click", async () => {
    updateBestLine();
    await setBg(bgEls.mode, getGirl(state.girlKey).top);
    showScreen("mode");
  }, { passive: true });

  btnModeBack?.addEventListener("click", async () => {
    renderGirlGrid();
    showScreen("girl");
  }, { passive: true });

  btnStartQuiz?.addEventListener("click", async () => {
    await startQuiz();
  }, { passive: true });

  btnStartChee?.addEventListener("click", async () => {
    await startCheeMode();
  }, { passive: true });

  /* ===== init ===== */
  (async function init() {
    state.girlKey = getSavedGirl();
    updateBestLine();
    await setBg(bgEls.top, getTopBg());
    showScreen("top");
  })();

})();
