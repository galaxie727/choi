/* =========================================================
   チーと言えばギュウと答える
   app.js v0.30.6  (25問 / Q1&Q25固定 / チー娘乱入最低3回保証(Lv1-3))
   ・All-Starモード（debug=1で擬似解放）
   ・エンディングは選択中の女の子固定
   ・星マーク＝その女の子のチギュテッド(100%)閲覧済
   ========================================================= */

(() => {
  "use strict";

  /* =======================
     VERSION
  ======================= */
  const APP_VERSION = "v0.30.6";

  /* =======================
     URL params
  ======================= */
  const params = new URLSearchParams(location.search);
  const DEBUG_UNLOCK = params.get("debug") === "1";

  /* =======================
     Storage keys
  ======================= */
  const CHEE_RECORD_KEY     = "cheeGirlBestStage";
  const GIRL_KEY            = "selectedGirlKey";
  const GIRL_PREVIEW_KEY    = "girlPreviewBgKey";
  const ALLSTAR_UNLOCK_KEY  = "allStarUnlocked";      // 実課金想定（今回は保存のみ）
  const ALLSTAR_TOGGLE_KEY  = "allStarEnabled";       // 選択状態
  const GIFTED_SEEN_PREFIX  = "giftedSeen_";           // giftedSeen_A = "1"

  const getBestStage = () => Number(localStorage.getItem(CHEE_RECORD_KEY)) || 0;
  const setBestStage = (stage) => localStorage.setItem(CHEE_RECORD_KEY, String(stage));

  const getSavedGirl = () => localStorage.getItem(GIRL_KEY) || "A";
  const saveGirl = (g) => localStorage.setItem(GIRL_KEY, g);

  const getPreviewKey = () => localStorage.getItem(GIRL_PREVIEW_KEY) || "";
  const setPreviewKey = (k) => localStorage.setItem(GIRL_PREVIEW_KEY, k);

  const isAllStarUnlocked = () => DEBUG_UNLOCK || (localStorage.getItem(ALLSTAR_UNLOCK_KEY) === "1");
  const getAllStarEnabled = () => localStorage.getItem(ALLSTAR_TOGGLE_KEY) === "1";
  const setAllStarEnabled = (v) => localStorage.setItem(ALLSTAR_TOGGLE_KEY, v ? "1" : "0");

  const hasGiftedSeen = (girlKey) => localStorage.getItem(GIFTED_SEEN_PREFIX + girlKey) === "1";
  const setGiftedSeen = (girlKey) => localStorage.setItem(GIFTED_SEEN_PREFIX + girlKey, "1");

  /* =======================
     Girls
  ======================= */
  function makeGirl(prefix, key, name, locked = false, chiOverText = "……") {
    const normal = Array.from({ length: 15 }, (_, i) => `${prefix}_normal_${String(i + 1).padStart(2, "0")}.png`);
    return {
      key, name, locked,
      icon: `${prefix}_icon.png`,
      top:  `${prefix}_top_01.png`,
      normal,
      gameover: `${prefix}_gameover_01.png`,
      chiGameover: `${prefix}_chi_gameover_01.png`,
      chiOverText,
      score: {
        s: Array.from({ length: 3 }, (_, i) => `${prefix}_score_s_${String(i + 1).padStart(2, "0")}.png`),
        a: Array.from({ length: 3 }, (_, i) => `${prefix}_score_a_${String(i + 1).padStart(2, "0")}.png`),
        b: Array.from({ length: 3 }, (_, i) => `${prefix}_score_b_${String(i + 1).padStart(2, "0")}.png`)
      }
    };
  }

  const GIRLS = [
    makeGirl("girlA", "A", "Girl A", false, "……（チー娘Aは無言で去っていった）"),
    makeGirl("girlB", "B", "Girl B", false, "……（チー娘B：見なかったことにするね）"),
    makeGirl("girlC", "C", "Girl C", false, "……（チー娘C：次はちゃんとして？）"),
    makeGirl("girlD", "D", "Girl D", true,  "（LOCKED）"),
    makeGirl("girlE", "E", "Girl E", true,  "（LOCKED）"),
    makeGirl("girlF", "F", "Girl F", true,  "（LOCKED）"),
  ];

  const getGirlByKey = (k) => GIRLS.find(x => x.key === k) || GIRLS[0];

  /* =======================
     Questions (25)
     Q1固定 / Q25固定
  ======================= */
  const questions = [
    { text: "あなたはチー牛ですか？" }, // Q1
    { text: "チーと言えば？" },
    { text: "牛丼屋さんのCMに出ている石原さとみさんに「チー」と言われたら？" },
    { text: "石原さとみさんに向かって「チー」と言ったら「ギュウ」と答えてくれるイベントを開催して欲しくないですか？" },
    { text: "石原さとみさんにあの笑顔で「ギュウ」と答えてもらえたら膝から崩れ落ちずにいられますか？" },
    { text: "チーズ牛丼を頼んだ人の顔をついチラ見してしまった事はありますか？" },
    { text: "知らない人を見て『チー牛かも』と思ってしまったことはありますか？" },
    { text: "あなたの友人にチー牛はいますか？" },
    { text: "大谷翔平選手には是非ともチーズ牛丼のCMに出て頂き「チー牛食おうぜ！」と言って欲しいですか？" },
    { text: "ハイチーズをハイチー牛だと思っていた時期がありますか？" },
    { text: "麻雀には、チーをされた瞬間にギュウと答えるとチーを取り消す『チーギュウ返し』がある。本当だと思いますか？" },
    { text: "あなたは三度の飯よりチーズ牛丼が好きですか？" },
    { text: "気付くと『チー』『ギュウ』『チー』『ギュウ』と交互に言っている事がありますか？" },
    { text: "『ギュウ』と答える練習をしたことがありますか？" },
    { text: "牛丼屋で『チーズ』の文字を見ると一瞬迷いますか？" },
    { text: "コンビニでチーズ系を見ると、なぜか心がざわつきますか？" },
    { text: "『チー』と聞こえたら反射的に『ギュウ』が頭に浮かびますか？" },
    { text: "『ギュウ』と言う時、なぜか誇らしい気持ちになりますか？" },
    { text: "チーズ牛丼を食べた後、ちょっと強くなった気がしますか？" },
    { text: "チーと言われると、少しだけ反応してしまいますか？" },
    { text: "あなたは『チー牛』を『悪口』ではなく『概念』だと思いますか？" },
    { text: "チーズ牛丼を『恥ずかしくて頼めない』人は実在すると思いますか？" },
    { text: "あなたは『頼めないが、本当は食べたい』側ですか？" },
    { text: "ギュウと言ったら、相手に❤で返してほしいですか？" },
    { text: "最後にひとこと。チーと言えば？" }, // Q25
  ];

  /* =======================
     Chee settings
  ======================= */
  const cheeLevelsNormal = [
    { stars: 1, timeMs: 2400, gauge: "cool",   weight: 0.60 },
    { stars: 2, timeMs: 1700, gauge: "yellow", weight: 0.30 },
    { stars: 3, timeMs: 1200, gauge: "red",    weight: 0.10 },
  ];
  const CHEE_RATE = 0.35; // 追加乱入率（保証とは別）

  // timing
  const QUESTION_SHOW_DELAY  = 120;
  const GIRL_REPLY_DELAY_MS  = 520;
  const NORMAL_REACT_MS      = 980;

  const CHEE_PRE_HOLD_MS     = 760;
  const CUT_MS               = 420;
  const POST_CUT_HOLD_MS     = 360;
  const CHEE_SILENCE_MS      = 260;
  const CHEE_SUCCESS_HOLD_MS = 820;

  const ANNOUNCE_EXTRA_MS    = 520;
  const FLASH_ON_MS          = 120;

  // stage3 boost (chee-only mode)
  const STAGE3_BOOST_MS      = 500;
  const STAGE3_BOOST_MULT    = 1.35;

  /* =======================
     State
  ======================= */
  let selectedGirlKey = getSavedGirl();
  let previewBgKey = getPreviewKey() || "";

  let gameMode = "quiz";  // "quiz" or "cheeOnly"
  let mode = "quiz";      // "quiz" | "chee" | "result"
  let locked = false;
  let ended = false;

  let i = 0;              // question index 0..24

  // chee-only mode
  let cheeStage = 1;
  let lastGyuuIndex = -1;

  // chee timer
  let rafId = 0;
  let currentCheeLevel = null;

  // record
  let isNewRecordRun = false;

  // Forced invasions (minimum 3 & must include Lv1/Lv2/Lv3)
  // key: questionIndex AFTER answering which we trigger chee battle
  // e.g. forcedMap[5] = 2 (means after answering Q6, do Lv2)
  let forcedMap = Object.create(null);

  // all-star enabled (only if unlocked)
  let allStarEnabled = false;

  // current active girl during play (all-star uses random each screen)
  let activeGirlKeyForPlay = null;

  /* =======================
     DOM (must exist in full HTML)
  ======================= */
  const byId = (id) => document.getElementById(id);

  const counterEl   = byId("counter");

  const topScreen   = byId("topScreen");
  const girlScreen  = byId("girlScreen");
  const modeScreen  = byId("modeScreen");
  const gameScreen  = byId("gameScreen");

  const girlBg      = document.querySelector("#girlScreen .bg");
  const modeBg      = document.querySelector("#modeScreen .bg");
  const gameBg      = document.querySelector("#gameScreen .bg");

  const girlGrid    = byId("girlGrid");
  const bestLine    = byId("bestLine");

  const qEl         = byId("question");
  const speechEl    = byId("speech");
  const choicesEl   = byId("choices");

  const gaugeWrap   = byId("gaugeWrap");
  const gaugeBar    = byId("gaugeBar");
  const flashEl     = byId("flash");

  const resultBox   = byId("resultBox");
  const resultPct   = byId("resultPct");

  // buttons
  const btnGoGirl   = byId("btnGoGirl");
  const btnGirlBack = byId("btnGirlBack");
  const btnGoMode   = byId("btnGoMode");
  const btnModeBack = byId("btnModeBack");

  const btnStartQuiz = byId("btnStartQuiz");
  const btnStartChee = byId("btnStartChee");

  /* =======================
     Utils
  ======================= */
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const shuffle = (a) => a.slice().sort(() => Math.random() - 0.5);
  const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  const getSelectedGirl = () => getGirlByKey(selectedGirlKey);

  const refreshBestLine = () => {
    if (bestLine) bestLine.textContent = `チー娘 BEST：ステージ${getBestStage()}`;
  };

  function preloadTops() {
    GIRLS.forEach(g => {
      const im = new Image();
      im.src = g.top;
    });
  }

  function setGirlAndModeBgToSelectedTop() {
    const g = getSelectedGirl();
    if (girlBg) girlBg.style.backgroundImage = `url("${g.top}")`;
    if (modeBg) modeBg.style.backgroundImage = `url("${g.top}")`;
  }

  function setGirlSelectPreviewBg(girlKey) {
    const g = getGirlByKey(girlKey);
    previewBgKey = g.key;
    setPreviewKey(g.key);
    if (girlBg) girlBg.style.backgroundImage = `url("${g.top}")`;
  }

  function getUnlockedGirls() {
    return GIRLS.filter(g => !g.locked);
  }

  function pickRandomUnlockedGirlKey() {
    const list = getUnlockedGirls();
    return pick(list).key;
  }

  function getPlayGirlKey() {
    // all-star: during play, random girl appears (but ending fixed to selected)
    if (allStarEnabled) {
      if (!activeGirlKeyForPlay) activeGirlKeyForPlay = pickRandomUnlockedGirlKey();
      return activeGirlKeyForPlay;
    }
    return selectedGirlKey;
  }

  /* =======================
     Audio (tiny)
  ======================= */
  let audioCtx = null;
  function ensureAudio() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AC();
    }
    if (audioCtx.state === "suspended") audioCtx.resume();
  }

  function playPopSE() {
    try {
      ensureAudio();
      const t0 = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(660, t0);
      osc.frequency.exponentialRampToValueAtTime(880, t0 + 0.03);

      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.18, t0 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.10);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(t0);
      osc.stop(t0 + 0.11);
    } catch (e) {}
  }

  function flashBg() {
    if (!flashEl) return;
    flashEl.classList.add("on");
    setTimeout(() => flashEl.classList.remove("on"), FLASH_ON_MS);
  }

  /* =======================
     UI helpers
  ======================= */
  const buttonColors = [
    "#d64545","#c0392b","#e67e22","#f1c40f",
    "#27ae60","#16a085","#2980b9","#8e44ad",
    "#2c3e50","#7f8c8d","#ff6b6b","#ffa502"
  ];

  function applyRandomColorsToButtons() {
    const btns = document.querySelectorAll("#choices button.choice");
    const cols = shuffle(buttonColors);
    btns.forEach((b, idx) => { b.style.background = cols[idx % cols.length]; });
  }

  function setButtonsEnabled(on) {
    document.querySelectorAll("#choices button").forEach(b => b.disabled = !on);
  }

  function clearSpeech() {
    speechEl.className = "";
    speechEl.textContent = "";
    speechEl.innerHTML = "";
  }

  function setSpeechPlain(text) {
    speechEl.className = "";
    speechEl.textContent = text;
  }

  function setHeartOnlyPop(isGold = false) {
    speechEl.className = isGold ? "heartGold" : "heartOnly";
    speechEl.textContent = "❤";
    speechEl.classList.remove("heartPop");
    void speechEl.offsetWidth;
    speechEl.classList.add("heartPop");
    playPopSE();
    flashBg();
  }

  function setGyuuWithHeart() {
    speechEl.className = "";
    speechEl.innerHTML = `ギュウ<span class="heartOnly">❤</span>`;
  }

  function setTextWithHeart(text) {
    speechEl.className = "";
    speechEl.innerHTML = `${text}<span class="heartOnly">❤</span>`;
  }

  /* =======================
     Gauge / chee visuals
  ======================= */
  function stopCheeTimer() { cancelAnimationFrame(rafId); rafId = 0; }

  function hideGauge() {
    if (!gaugeWrap) return;
    gaugeWrap.classList.remove("show");
    if (gaugeBar) gaugeBar.style.transform = "scaleX(0)";
  }

  function showGauge() {
    if (!gaugeWrap) return;
    gaugeWrap.classList.add("show");
  }

  function resetCheeVisuals() {
    gameScreen.classList.remove("chee","cut","announce","hold","stage3plus","result");
    hideGauge();
    stopCheeTimer();
    if (gaugeBar) {
      gaugeBar.classList.remove("yellow","red");
      gaugeBar.style.transform = "scaleX(0)";
    }
    currentCheeLevel = null;
    if (choicesEl) choicesEl.classList.remove("chee10");
  }

  /* =======================
     Choices
  ======================= */
  function buildChoices4() {
    choicesEl.classList.remove("chee10");
    choicesEl.innerHTML = "";
    const items = [["はい"],["いいえ"],["チー"],["ギュウ"]];
    shuffle(items).forEach(([t]) => {
      const b = document.createElement("button");
      b.textContent = t;
      b.className = "choice";
      b.onclick = () => answer(t);
      choicesEl.appendChild(b);
    });
    applyRandomColorsToButtons();
  }

  function buildChoicesChee10() {
    const decoys = [
      "はい","いいえ","チー","ポン","カン","ドン","モー","牛","チーズ","特盛り",
      "並","大盛り","湯気","ニコッ","クスッ","笑","うし","ぎゅ","チー牛","牛丼"
    ];
    const nine = shuffle(decoys.filter(x => x !== "ギュウ")).slice(0, 9);
    let labels = ["ギュウ", ...nine];

    for (let k = 0; k < 10; k++) {
      labels = shuffle(labels);
      const idx = labels.indexOf("ギュウ");
      if (idx !== lastGyuuIndex) { lastGyuuIndex = idx; break; }
    }

    choicesEl.classList.add("chee10");
    choicesEl.innerHTML = "";
    labels.forEach(label => {
      const b = document.createElement("button");
      b.textContent = label;
      b.className = "choice";
      b.onclick = () => answer(label);
      choicesEl.appendChild(b);
    });
    applyRandomColorsToButtons();
  }

  /* =======================
     Screens
  ======================= */
  function showOnly(screen) {
    [topScreen, girlScreen, modeScreen, gameScreen].forEach(s => s.classList.add("hide"));
    screen.classList.remove("hide");
  }

  function goTop() {
    stopCheeTimer();
    resetCheeVisuals();

    mode = "quiz";
    ended = false;
    locked = false;

    activeGirlKeyForPlay = null;

    if (counterEl) counterEl.textContent = "-";
    refreshBestLine();
    showOnly(topScreen);
  }

  function goGirlSelect() {
    refreshBestLine();
    renderGirlGrid();

    if (previewBgKey) setGirlSelectPreviewBg(previewBgKey);
    else setGirlAndModeBgToSelectedTop();

    showOnly(girlScreen);
  }

  function goModeSelect() {
    refreshBestLine();
    setGirlAndModeBgToSelectedTop();
    showOnly(modeScreen);
  }

  /* =======================
     Girl grid (star mark = gifted seen)
  ======================= */
  function attachPreviewHandlers(tile, g) {
    tile.addEventListener("pointerdown", () => setGirlSelectPreviewBg(g.key), { passive: true });
    tile.addEventListener("pointerenter", () => setGirlSelectPreviewBg(g.key), { passive: true });
  }

  function renderGirlGrid() {
    girlGrid.innerHTML = "";

    GIRLS.forEach(g => {
      const tile = document.createElement("button");
      tile.className = "girlTile"
        + (g.key === selectedGirlKey ? " active" : "")
        + (g.locked ? " locked" : "");
      tile.type = "button";

      attachPreviewHandlers(tile, g);

      tile.onclick = () => {
        if (g.locked) return;
        selectedGirlKey = g.key;
        saveGirl(g.key);
        setGirlAndModeBgToSelectedTop();
        renderGirlGrid();
      };

      const gifted = hasGiftedSeen(g.key);
      const starHtml = gifted ? `<div class="lockBadge" style="left:10px;right:auto;">★</div>` : ``;

      tile.innerHTML = `
        <div class="iconBox">
          <img src="${g.icon}" alt="${g.name}" onerror="this.style.display='none'">
        </div>
        <div class="girlName">${g.name}</div>
        ${g.locked ? `<div class="lockBadge">LOCK</div>` : ``}
        ${starHtml}
      `;
      girlGrid.appendChild(tile);
    });
  }

  /* =======================
     Background application
  ======================= */
  function applyGameQuestionBg() {
    const g = getGirlByKey(getPlayGirlKey());
    gameBg.style.backgroundImage = `url("${g.normal[i % g.normal.length]}")`;
  }

  /* =======================
     Forced chee plan
     - after answering some questions (exclude Q1 and Q25)
     - must include Lv1/Lv2/Lv3 at least once
  ======================= */
  function buildForcedPlan() {
    forcedMap = Object.create(null);

    // eligible indices: after answering Q2..Q23 (0-based i=1..22)
    // (Q1 i=0 is excluded, Q25 i=24 is excluded, and must have next question)
    const eligible = [];
    for (let idx = 1; idx <= 22; idx++) eligible.push(idx);

    // pick 3 distinct positions
    const picks = shuffle(eligible).slice(0, 3).sort((a,b)=>a-b);
    const levels = shuffle([1, 2, 3]); // assign Lv1-3

    for (let k = 0; k < 3; k++) {
      forcedMap[picks[k]] = levels[k];
    }
  }

  function pickCheeLevelNormal() {
    const r = Math.random();
    let acc = 0;
    for (const lv of cheeLevelsNormal) {
      acc += lv.weight;
      if (r <= acc) return lv;
    }
    return cheeLevelsNormal[0];
  }

  function forceLevelToCheeObj(levelStars) {
    // match stars -> time/gauge
    if (levelStars === 1) return { stars: 1, timeMs: 2400, gauge: "cool" };
    if (levelStars === 2) return { stars: 2, timeMs: 1700, gauge: "yellow" };
    return { stars: 3, timeMs: 1200, gauge: "red" };
  }

  /* =======================
     Game flow (show question)
  ======================= */
  function showQuestion() {
    ended = false;
    locked = false;
    mode = "quiz";

    gameScreen.classList.remove("result");
    if (resultBox) resultBox.classList.add("hide");

    resetCheeVisuals();
    applyGameQuestionBg();

    qEl.classList.add("hide");
    qEl.textContent = questions[i].text;
    clearSpeech();

    if (counterEl) counterEl.textContent = `${i + 1}/${questions.length}`;

    setTimeout(() => qEl.classList.remove("hide"), QUESTION_SHOW_DELAY);

    if (gameMode === "cheeOnly") buildChoicesChee10();
    else buildChoices4();

    setButtonsEnabled(true);

    // all-star: each question pick a new girl for next scene
    if (allStarEnabled) activeGirlKeyForPlay = pickRandomUnlockedGirlKey();
  }

  /* =======================
     Chee spawn decision (after a normal question)
     - NEVER on Q1 or Q25
     - Forced plan triggers at forcedMap[i]
  ======================= */
  function maybeCheeAfterNormal() {
    if (ended) return;

    // If we just answered last question -> result
    if (i >= questions.length - 1) {
      endResult();
      return;
    }

    // Q1(i=0) and Q25(i=24) are fixed and no chee spawn
    if (i === 0 || i === questions.length - 1) {
      i++;
      if (i < questions.length) showQuestion();
      else endResult();
      return;
    }

    // Forced trigger?
    const forcedStars = forcedMap[i];
    if (forcedStars) {
      // consume
      delete forcedMap[i];
      setButtonsEnabled(false);
      gameScreen.classList.add("hold");
      setTimeout(() => {
        gameScreen.classList.remove("hold");
        startCheeBattle(forceLevelToCheeObj(forcedStars));
      }, CHEE_PRE_HOLD_MS);
      return;
    }

    // Random extra
    if (Math.random() < CHEE_RATE) {
      setButtonsEnabled(false);
      gameScreen.classList.add("hold");
      setTimeout(() => {
        gameScreen.classList.remove("hold");
        startCheeBattle(pickCheeLevelNormal());
      }, CHEE_PRE_HOLD_MS);
      return;
    }

    // Next question
    i++;
    if (i < questions.length) showQuestion();
    else endResult();
  }

  /* =======================
     Chee battle
  ======================= */
  function startCheeBattle(level) {
    if (ended) return;

    mode = "chee";
    locked = false;
    currentCheeLevel = level;

    gameScreen.classList.add("cut","announce","chee");
    if (level.stars >= 3) gameScreen.classList.add("stage3plus");

    // pick bg from current play girl
    const g = getGirlByKey(getPlayGirlKey());
    gameBg.style.backgroundImage = `url("${pick(g.normal)}")`;

    setTimeout(() => {
      setTimeout(() => {
        gameScreen.classList.remove("cut","announce");

        qEl.textContent = "";
        qEl.classList.add("hide");
        clearSpeech();

        setTimeout(() => {
          speechEl.className = "cheeWord" + (level.stars >= 3 ? " big" : "");
          speechEl.textContent = "チー！";

          if (gameMode === "cheeOnly") buildChoicesChee10();
          else buildChoices4();

          startCheeTimer(level);
          setButtonsEnabled(true);
        }, CHEE_SILENCE_MS);

      }, POST_CUT_HOLD_MS);
    }, CUT_MS + ANNOUNCE_EXTRA_MS);
  }

  function startCheeTimer(level) {
    stopCheeTimer();
    showGauge();

    gaugeBar.classList.remove("yellow","red");
    if (level.gauge === "yellow") gaugeBar.classList.add("yellow");
    if (level.gauge === "red") gaugeBar.classList.add("red");

    const start = performance.now();

    const tick = (t) => {
      let elapsed = t - start;

      // boost only for chee-only stage3+
      if (gameMode === "cheeOnly" && level.stars >= 3) {
        if (elapsed < STAGE3_BOOST_MS) {
          elapsed = elapsed * STAGE3_BOOST_MULT;
        } else {
          const boosted = STAGE3_BOOST_MS * STAGE3_BOOST_MULT;
          elapsed = boosted + (elapsed - STAGE3_BOOST_MS);
        }
      }

      const r = Math.max(0, 1 - (elapsed / level.timeMs));
      gaugeBar.style.transform = `scaleX(${r})`;

      if (level.gauge === "cool") {
        gaugeBar.style.background = `hsl(${210 * r}, 85%, 55%)`;
      }

      if (r > 0) {
        rafId = requestAnimationFrame(tick);
      } else {
        gameOver(true);
      }
    };

    rafId = requestAnimationFrame(tick);
  }

  /* =======================
     Chee-only mode
  ======================= */
  function cheeOnlyPickStage() {
    let stage = cheeStage;
    if (Math.random() < 0.25) {
      stage = Math.max(1, stage - (Math.random() < 0.7 ? 1 : 2));
    }
    const stars = stage <= 1 ? 1 : (stage === 2 ? 2 : 3);
    const base = 2400 - (stage - 1) * 120;
    const timeMs = Math.max(550, Math.round(base));
    const gaugeType = stars === 1 ? "cool" : (stars === 2 ? "yellow" : "red");
    return { stars, timeMs, gauge: gaugeType, stage };
  }

  function nextCheeOnlyAfterWin() {
    cheeStage++;
    if (counterEl) counterEl.textContent = `ステージ${cheeStage}`;

    const best = getBestStage();
    if (cheeStage > best) {
      setBestStage(cheeStage);
      isNewRecordRun = true;
    }

    const lv = cheeOnlyPickStage();
    startCheeBattle(lv);
  }

  /* =======================
     Scoring (80-99 / 2% 100)
  ======================= */
  function rollScore() {
    const r = Math.random();
    if (r < 0.02) return 100;
    return randInt(80, 99);
  }

  function rankFromScore(p) {
    if (p === 100) return "gifted";
    if (p >= 95) return "s";
    if (p >= 88) return "a";
    return "b";
  }

  /* =======================
     Answer handling
  ======================= */
  function answer(t) {
    if (locked || ended) return;
    locked = true;
    setButtonsEnabled(false);

    ensureAudio();
    qEl.classList.add("hide");

    // CHEE mode
    if (mode === "chee") {
      if (t === "ギュウ") {
        stopCheeTimer();
        hideGauge();

        setTimeout(() => setHeartOnlyPop(isNewRecordRun), GIRL_REPLY_DELAY_MS);

        setTimeout(() => {
          resetCheeVisuals();

          if (gameMode === "cheeOnly") {
            nextCheeOnlyAfterWin();
            return;
          }

          // return to normal flow: go next question
          i++;
          if (i < questions.length) showQuestion();
          else endResult();

        }, GIRL_REPLY_DELAY_MS + CHEE_SUCCESS_HOLD_MS);

      } else {
        gameOver(true);
      }
      return;
    }

    // NORMAL quiz mode
    const isLast = (i === questions.length - 1);

    // reply
    setTimeout(() => {
      if (t === "はい")        setTextWithHeart("笑");
      else if (t === "いいえ") setTextWithHeart("クスッ");
      else if (t === "ギュウ") setTextWithHeart("ニコッ");
      else if (t === "チー")   setGyuuWithHeart();
      else                     setTextWithHeart("笑");
    }, GIRL_REPLY_DELAY_MS);

    setTimeout(() => {
      // Q25: ギュウ以外はゲームオーバー（仕様）
      if (isLast) {
        if (t !== "ギュウ") {
          gameOver(false);
          return;
        }
        endResult();
        return;
      }

      // proceed (maybe chee / next)
      maybeCheeAfterNormal();

    }, GIRL_REPLY_DELAY_MS + NORMAL_REACT_MS);
  }

  /* =======================
     End buttons
  ======================= */
  function renderEndButtonsDelayed(delayMs) {
    choicesEl.innerHTML = "";
    setTimeout(() => {
      choicesEl.innerHTML = `
        <button class="choice" style="grid-column:1/-1" onclick="restart(window.__gameMode)">もう一回</button>
        <button class="choice" style="grid-column:1/-1" onclick="goTop()">トップに戻る</button>
      `;
      applyRandomColorsToButtons();
    }, delayMs);
  }

  /* =======================
     Result
  ======================= */
  function animatePercent(to) {
    const dur = 900;
    const start = performance.now();
    const from = 0;

    const tick = (t) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = Math.round(from + (to - from) * eased);

      if (v >= 100) resultPct.innerHTML = `100<small>%</small>`;
      else resultPct.innerHTML = `${v}<small>%</small>`;

      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function endResult() {
    ended = true;
    mode = "result";
    resetCheeVisuals();

    gameScreen.classList.add("result");
    if (resultBox) resultBox.classList.remove("hide");

    const selected = getSelectedGirl(); // ★エンディングは選択中固定

    const score = rollScore();
    const rank = rankFromScore(score);

    // mark gifted seen
    if (score === 100) setGiftedSeen(selected.key);

    let img = selected.top;
    if (rank === "gifted") img = pick(selected.score.s);
    else if (rank === "s") img = pick(selected.score.s);
    else if (rank === "a") img = pick(selected.score.a);
    else img = pick(selected.score.b);

    gameBg.style.backgroundImage = `url("${img}")`;

    qEl.textContent = "";
    clearSpeech();
    if (counterEl) counterEl.textContent = "RESULT";

    resultPct.innerHTML = `0<small>%</small>`;
    animatePercent(score);

    if (rank === "gifted") {
      setTimeout(() => setSpeechPlain("……君、チギュテッドだね。"), 520);
    }

    renderEndButtonsDelayed(0);
  }

  /* =======================
     Game over
  ======================= */
  function gameOver(isCheeBattle) {
    ended = true;
    resetCheeVisuals();

    gameScreen.classList.remove("result");
    if (resultBox) resultBox.classList.add("hide");

    if (gameMode === "cheeOnly") {
      const reachedStage = cheeStage;
      const bestStage = getBestStage();

      if (reachedStage > bestStage) {
        setBestStage(reachedStage);
        isNewRecordRun = true;
      }

      const g = getSelectedGirl();
      gameBg.style.backgroundImage = `url("${g.chiGameover}")`;
      clearSpeech();
      setSpeechPlain(g.chiOverText);

      if (counterEl) counterEl.textContent = `GAME OVER（ステージ${reachedStage}）`;

      renderEndButtonsDelayed(1000);
      return;
    }

    // quiz gameover: use current play girl (all-starならその時の子)
    const g = getGirlByKey(getPlayGirlKey());
    gameBg.style.backgroundImage = `url("${g.gameover}")`;
    clearSpeech();
    setSpeechPlain("あなたチー牛じゃなかったのね。。");
    if (counterEl) counterEl.textContent = "GAME OVER";

    renderEndButtonsDelayed(1000);
  }

  /* =======================
     Restart
  ======================= */
  function restart(modeName) {
    ended = false;
    locked = false;
    stopCheeTimer();
    resetCheeVisuals();

    gameMode = modeName || "quiz";
    window.__gameMode = gameMode;

    isNewRecordRun = false;
    activeGirlKeyForPlay = null;

    // all-star toggle
    allStarEnabled = isAllStarUnlocked() && getAllStarEnabled();

    showOnly(gameScreen);

    if (gameMode === "cheeOnly") {
      cheeStage = 1;
      lastGyuuIndex = -1;
      if (counterEl) counterEl.textContent = `ステージ${cheeStage}`;
      startCheeBattle(cheeOnlyPickStage());
      return;
    }

    // quiz
    i = 0;
    buildForcedPlan(); // ★必ず Lv1-3 を体験できる保証
    showQuestion();
  }

  /* =======================
     Init wiring
  ======================= */
  function init() {
    // set version label in html if exists
    const versionEl = byId("versionVal");
    if (versionEl) versionEl.textContent = APP_VERSION;

    selectedGirlKey = getSavedGirl();
    previewBgKey = getPreviewKey() || "";

    preloadTops();
    refreshBestLine();
    setGirlAndModeBgToSelectedTop();

    // Default: if unlocked and debug=1, keep all-star disabled unless user toggles (state kept)
    if (!isAllStarUnlocked()) setAllStarEnabled(false);

    // buttons
    if (btnGoGirl)   btnGoGirl.onclick = () => goGirlSelect();
    if (btnGirlBack) btnGirlBack.onclick = () => goTop();
    if (btnGoMode)   btnGoMode.onclick = () => goModeSelect();
    if (btnModeBack) btnModeBack.onclick = () => goGirlSelect();

    if (btnStartQuiz) btnStartQuiz.onclick = () => restart("quiz");
    if (btnStartChee) btnStartChee.onclick = () => restart("cheeOnly");

    goTop();
  }

  /* =======================
     Expose minimal globals
     (inline onclick used by end buttons)
  ======================= */
  window.goTop = goTop;
  window.restart = restart;
  window.__gameMode = "quiz";

  // OPTIONAL: quick toggle via console (or later UI)
  window.__setAllStar = (on) => {
    if (!isAllStarUnlocked()) return false;
    setAllStarEnabled(!!on);
    return true;
  };

  // start
  init();

})();
