/* ==============================
  チーと言えばギュウと答える
  app.js v0.30.6 (fix: chi battle 10 choices + smooth + shake)
================================ */

(() => {
  "use strict";

  /* ========= VERSION ========= */
  const APP_VERSION = "v0.30.6";
  const versionValEl = document.getElementById("versionVal");
  if (versionValEl) versionValEl.textContent = APP_VERSION;

  /* ========= STORAGE KEYS ========= */
  const CHEE_RECORD_KEY = "cheeGirlBestStage";
  const GIRL_KEY = "selectedGirlKey";

  const getBestStage = () => Number(localStorage.getItem(CHEE_RECORD_KEY) || "0");
  const setBestStage = (stage) => localStorage.setItem(CHEE_RECORD_KEY, String(stage));
  const getSavedGirl = () => localStorage.getItem(GIRL_KEY) || "A";
  const saveGirl = (g) => localStorage.setItem(GIRL_KEY, g);

  /* ========= DOM ========= */
  const el = {
    counter: document.getElementById("counter"),

    top: document.getElementById("topScreen"),
    girl: document.getElementById("girlScreen"),
    mode: document.getElementById("modeScreen"),
    game: document.getElementById("gameScreen"),

    btnGoGirl: document.getElementById("btnGoGirl"),
    btnGirlBack: document.getElementById("btnGirlBack"),
    btnGoMode: document.getElementById("btnGoMode"),

    btnStartQuiz: document.getElementById("btnStartQuiz"),
    btnStartChee: document.getElementById("btnStartChee"),
    btnModeBack: document.getElementById("btnModeBack"),

    girlGrid: document.getElementById("girlGrid"),
    bestLine: document.getElementById("bestLine"),

    question: document.getElementById("question"),
    speech: document.getElementById("speech"),
    choices: document.getElementById("choices"),

    gaugeWrap: document.getElementById("gaugeWrap"),
    gaugeBar: document.getElementById("gaugeBar"),

    resultBox: document.getElementById("resultBox"),
    resultPct: document.getElementById("resultPct"),
  };

  function bgOf(screenEl) {
    return screenEl?.querySelector(".bg");
  }

  /* ========= SHAKE CSS (inject) ========= */
  const shakeStyleId = "chiShakeStyle";
  if (!document.getElementById(shakeStyleId)) {
    const st = document.createElement("style");
    st.id = shakeStyleId;
    st.textContent = `
      @keyframes chiShake {
        0%{transform:translate(0,0)}
        10%{transform:translate(-2px,1px)}
        20%{transform:translate(2px,-1px)}
        30%{transform:translate(-3px,-1px)}
        40%{transform:translate(3px,2px)}
        50%{transform:translate(-2px,2px)}
        60%{transform:translate(2px,0)}
        70%{transform:translate(-1px,-2px)}
        80%{transform:translate(1px,2px)}
        90%{transform:translate(-2px,1px)}
        100%{transform:translate(0,0)}
      }
      .chi-shake {
        animation: chiShake 320ms linear infinite;
      }
    `;
    document.head.appendChild(st);
  }

  /* ========= GIRLS =========
     D/E/F は icon と top だけ -> locked で扱う（選べるがLOCK表示＆開始不可）
  */
  const girls = [
    { key: "A", name: "Girl A", locked: false, prefix: "girlA" },
    { key: "B", name: "Girl B", locked: false, prefix: "girlB" },
    { key: "C", name: "Girl C", locked: false, prefix: "girlC" },
    { key: "D", name: "Girl D", locked: true,  prefix: "girlD" },
    { key: "E", name: "Girl E", locked: true,  prefix: "girlE" },
    { key: "F", name: "Girl F", locked: true,  prefix: "girlF" },
  ];

  const girlByKey = (k) => girls.find(g => g.key === k) || girls[0];

  function fileExistsGuess(p) {
    // GitHub Pages での存在確認は重いので “推測 + プリロード”でOKにする
    return p;
  }

  function girlIcon(g) { return fileExistsGuess(`${g.prefix}_icon.png`); }
  function girlTop(g)  { return fileExistsGuess(`${g.prefix}_top_01.png`); }
  function girlNormal(g, n) { return fileExistsGuess(`${g.prefix}_normal_${String(n).padStart(2,"0")}.png`); }
  function girlGO(g) { return fileExistsGuess(`${g.prefix}_gameover_01.png`); }
  function girlChiGO(g) { return fileExistsGuess(`${g.prefix}_chi_gameover_01.png`); }
  function girlClear(g, n) { return fileExistsGuess(`${g.prefix}_clear_${String(n).padStart(2,"0")}.png`); }

  /* ========= IMAGE PRELOAD ========= */
  const imgCache = new Map(); // url -> Promise<void>
  function preload(url) {
    if (!url) return Promise.resolve();
    if (imgCache.has(url)) return imgCache.get(url);
    const p = new Promise((resolve) => {
      const im = new Image();
      im.onload = () => resolve();
      im.onerror = () => resolve(); // 失敗しても落とさない
      im.src = url;
    });
    imgCache.set(url, p);
    return p;
  }

  async function setBgImage(screenEl, url) {
    const bg = bgOf(screenEl);
    if (!bg) return;
    await preload(url);
    bg.style.backgroundImage = `url("${url}")`;
  }

  /* ========= SCREEN SWITCH ========= */
  function showScreen(target) {
    const list = [el.top, el.girl, el.mode, el.game];
    list.forEach(s => s && s.classList.add("hide"));
    target.classList.remove("hide");
  }

  function setCounter(text) {
    if (el.counter) el.counter.textContent = text ?? "-";
  }

  /* ========= BUTTON / CHOICES ========= */
  function clearChoices() {
    el.choices.innerHTML = "";
  }

  function renderChoices(labels, onPick, { disabled=false } = {}) {
    clearChoices();
    labels.forEach((t) => {
      const b = document.createElement("button");
      b.className = "choice";
      b.textContent = t;
      b.disabled = !!disabled;
      // 見た目（適当でOK）
      // 4択/10択どちらでも見やすいように
      if (t === "ギュウ") b.style.background = "rgba(255,255,255,.22)";
      else b.style.background = "rgba(255,255,255,.10)";
      b.addEventListener("click", () => onPick(t));
      el.choices.appendChild(b);
    });
  }

  function disableChoices() {
    [...el.choices.querySelectorAll("button")].forEach(b => b.disabled = true);
  }

  /* ========= GAUGE / TIMER ========= */
  let timerRAF = null;
  let timerEndAt = 0;
  let timerOnTimeout = null;

  function stopTimer() {
    if (timerRAF) cancelAnimationFrame(timerRAF);
    timerRAF = null;
    timerEndAt = 0;
    timerOnTimeout = null;
    el.gaugeWrap?.classList.remove("show");
    if (el.gaugeBar) el.gaugeBar.style.transform = "scaleX(0)";
  }

  function startTimer(ms, { color="yellow", onTimeout } = {}) {
    stopTimer();
    if (!el.gaugeWrap || !el.gaugeBar) return;

    timerOnTimeout = onTimeout;
    timerEndAt = performance.now() + ms;

    el.gaugeBar.classList.remove("yellow","red");
    el.gaugeBar.classList.add(color);
    el.gaugeBar.style.transform = "scaleX(1)";
    el.gaugeWrap.classList.add("show");

    const tick = () => {
      const now = performance.now();
      const remain = Math.max(0, timerEndAt - now);
      const ratio = ms <= 0 ? 0 : (remain / ms);
      el.gaugeBar.style.transform = `scaleX(${ratio})`;
      if (remain <= 0) {
        stopTimer();
        if (typeof timerOnTimeout === "function") timerOnTimeout();
        return;
      }
      timerRAF = requestAnimationFrame(tick);
    };
    timerRAF = requestAnimationFrame(tick);
  }

  /* ========= TEXT / SPEECH ========= */
  function setQuestionText(t) {
    el.question.textContent = t || "";
  }
  function setSpeechText(t) {
    el.speech.textContent = t || "";
  }

  /* ========= GAME STATE ========= */
  const STATE = {
    mode: null, // "quiz" | "chee"
    girlKey: getSavedGirl(),
    qIndex: 0,
    totalQ: 25,

    // chi battle
    inChiBattle: false,
    chiLevel: 0,

    // chee mode stage
    stage: 0,
    bestStage: getBestStage(),
  };

  function currentGirl() {
    return girlByKey(STATE.girlKey);
  }

  function updateBestLine() {
    if (!el.bestLine) return;
    STATE.bestStage = getBestStage();
    el.bestLine.textContent = `チー娘 BEST：ステージ${STATE.bestStage}`;
  }

  /* ========= QUESTIONS (25) =========
     1問目固定 / 25問目は「ギュウ」以外即ゲームオーバー用
  */
  const quizQuestions = [
    { text: "あなたはチー牛ですか？", correct: ["はい","ギュウ"] }, // ※“ギュウでも正解扱い”にして遊びやすく
    { text: "チーと言えば？", correct: ["ギュウ"] },
    { text: "石原さとみさんに「チー」って言われたら？", correct: ["ギュウ"] },
    { text: "石原さとみさんに「ギュウ」って言ってもらいたい？", correct: ["はい","ギュウ"] },
    { text: "チーズ牛丼を頼んだ人を一瞬だけ見てしまったことはありますか？", correct: ["はい","ギュウ"] },
    { text: "知らない人を見て『チー牛かも』と思ってしまったことはありますか？", correct: ["はい","ギュウ"] },
    { text: "あなたの友人にチー牛はいますか？", correct: ["はい","ギュウ"] },
    { text: "大谷翔平選手に言ってほしい言葉1位は『チー牛食おうぜ！』だと思う？", correct: ["はい","ギュウ"] },
    { text: "『チーギュウ返し』って本当にあると思う？", correct: ["はい","ギュウ"] },
    { text: "三度の飯よりチー牛が好き？", correct: ["はい","ギュウ"] },

    { text: "今日、なぜかギュウって言いたくなってる？", correct: ["はい","ギュウ"] },
    { text: "『チー』と聞いたら反射で？", correct: ["ギュウ"] },
    { text: "今の気分はチー？ギュウ？", correct: ["ギュウ"] },
    { text: "“ギュウ”って言う時、ちょっと誇らしい？", correct: ["はい","ギュウ"] },
    { text: "チーズ牛丼の湯気でイケメンに見える時がありますか？", correct: ["はい","ギュウ"] },

    { text: "あなたは“チギュテッド”になれる素質がある？", correct: ["はい","ギュウ"] },
    { text: "ギュウを言わずに我慢できる？", correct: ["いいえ","ギュウ"] },
    { text: "このゲーム、実はもう答え分かってる？", correct: ["はい","ギュウ"] },
    { text: "今ここで『チー』って言ったら…？", correct: ["ギュウ"] },
    { text: "最後はどうせギュウだと思ってますか？", correct: ["はい","ギュウ"] },

    { text: "“チー”って言われたら0.2秒以内に？", correct: ["ギュウ"] },
    { text: "あなたの中のチー牛度は高い？", correct: ["はい","ギュウ"] },
    { text: "ギュウって答えるの、気持ちいい？", correct: ["はい","ギュウ"] },
    { text: "ここまで来たなら、もう…？", correct: ["ギュウ"] },

    // 25問目：ギュウ以外は即GAME OVER
    { text: "ラスト。チーと言えば？", correct: ["ギュウ"], forceGyuuOnly: true },
  ];

  /* ========= CHI BATTLE SETTINGS ========= */
  function chiBattleDuration(level) {
    // 診断モードの乱入＆チー娘モード共通
    if (level <= 1) return 2600;
    if (level === 2) return 1800;
    return 1200; // Lv3+
  }
  function chiBattleColor(level) {
    return level >= 3 ? "red" : "yellow";
  }
  function shouldShake(level) {
    return level >= 3;
  }

  function makeChi10Choices() {
    // “ギュウ” + 9個デコイ（それっぽく）
    const pool = [
      "チー", "はい", "いいえ", "モー", "ギュー", "ギュ〜", "ギュウ…", "チーズ", "牛丼"
    ];
    // シャッフルして9個選ぶ（固定でもいいけど少しランダム）
    const a = pool.slice();
    for (let i=a.length-1;i>0;i--){
      const j = (Math.random()*(i+1))|0;
      [a[i],a[j]]=[a[j],a[i]];
    }
    const picks = a.slice(0,9);
    const all = ["ギュウ", ...picks];
    // 位置もランダムに
    for (let i=all.length-1;i>0;i--){
      const j = (Math.random()*(i+1))|0;
      [all[i],all[j]]=[all[j],all[i]];
    }
    return all;
  }

  /* ========= GAMEOVER / RESULT ========= */
  async function showGameOver({ chi=false } = {}) {
    stopTimer();
    disableChoices();
    setSpeechText("");
    setCounter("GAME OVER");

    // 背景画像を gameover に
    const g = currentGirl();
    const url = chi ? girlChiGO(g) : girlGO(g);
    await setBgImage(el.game, url);

    // どこタップでもトップに戻す（誤タップ防止で1秒ディレイ）
    const blocker = document.createElement("div");
    blocker.style.position = "absolute";
    blocker.style.inset = "0";
    blocker.style.zIndex = "10";
    blocker.style.background = "transparent";
    el.game.appendChild(blocker);

    setTimeout(() => {
      blocker.addEventListener("click", () => {
        blocker.remove();
        goTop();
      }, { once:true });
    }, 900);
  }

  async function showResultRandom() {
    // 今は採点ガチにしない：80〜100ランダム（チギュテッド2%）
    let pct = 80 + ((Math.random()*21)|0);
    if (Math.random() < 0.02) pct = 100;

    if (el.resultPct) el.resultPct.innerHTML = `${pct}<small>%</small>`;
    if (el.resultBox) el.resultBox.classList.remove("hide");

    // 結果画像（スコア画像があるなら将来ここで出し分け）
    const g = currentGirl();
    await setBgImage(el.game, girlClear(g, 1)); // とりあえず clear_01
  }

  /* ========= QUIZ FLOW ========= */
  const chiIntrusions = [7, 15, 21]; // 1-based question index で最低3回
  let chiIntrusionCursor = 0;

  function isNextIntrusion(qNumber1Based) {
    const target = chiIntrusions[chiIntrusionCursor];
    return target === qNumber1Based;
  }

  async function startQuiz() {
    STATE.mode = "quiz";
    STATE.qIndex = 0;
    STATE.inChiBattle = false;
    STATE.chiLevel = 0;
    chiIntrusionCursor = 0;

    el.resultBox?.classList.add("hide");

    await setBgImage(el.game, girlNormal(currentGirl(), 1));
    showScreen(el.game);
    nextQuizQuestion();
  }

  async function nextQuizQuestion() {
    stopTimer();
    document.body.classList.remove("chi-shake");
    STATE.inChiBattle = false;

    const qNum = STATE.qIndex + 1;
    if (qNum > STATE.totalQ) {
      // 結果
      await showResultRandom();
      // 2秒後にトップへ戻す（雑に）
      setTimeout(goTop, 2500);
      return;
    }

    setCounter(`${qNum}/${STATE.totalQ}`);

    // 乱入チェック（ただしラストは固定で邪魔しない）
    if (qNum < STATE.totalQ && isNextIntrusion(qNum)) {
      chiIntrusionCursor++;
      const level = Math.min(3, chiIntrusionCursor); // Lv1->Lv2->Lv3
      await showChiEntrance(level, () => startChiBattle(level, { afterWin: () => {
        // バトル勝利後に同じ問題へ戻る（問題は消さない）
        nextQuizQuestion();
      }}));
      return;
    }

    const q = quizQuestions[STATE.qIndex] || quizQuestions[quizQuestions.length-1];
    setQuestionText(q.text);
    setSpeechText("");

    // 背景は通常画像を軽く回す（存在しない番号でも落ちない）
    const g = currentGirl();
    const bgNo = ((STATE.qIndex % 15) + 1);
    await setBgImage(el.game, girlNormal(g, bgNo));

    // 4択
    const four = ["いいえ", "はい", "ギュウ", "チー"];
    renderChoices(four, async (pick) => {
      disableChoices();

      // ラストの “ギュウ以外即死”
      if (q.forceGyuuOnly && pick !== "ギュウ") {
        await showGameOver({ chi:false });
        return;
      }

      // 通常判定（基本ゆるめ）
      if ((q.correct || []).includes(pick)) {
        // 正解演出は “ギュウ”固定
        setSpeechText("ギュウ");
        setTimeout(() => {
          STATE.qIndex++;
          nextQuizQuestion();
        }, 420);
      } else {
        // 不正解は無言 or …
        setSpeechText("……");
        setTimeout(async () => {
          await showGameOver({ chi:false });
        }, 380);
      }
    });

    STATE.qIndex++;
    // ↑ここでインクリメントすると乱入でズレるのでダメ
    // → 直前で進めない：クリック時に進める
    STATE.qIndex--;
  }

  /* ========= CHI ENTRANCE / BATTLE ========= */
  async function showChiEntrance(level, onDone) {
    // “チー娘登場” を一瞬出してから切り替える
    stopTimer();
    document.body.classList.remove("chi-shake");
    setSpeechText("");

    // 表示文
    setQuestionText(`チー娘 Lv${level}「チーと言えば？」`);
    renderChoices(["チー娘登場"], () => {}, { disabled:true });

    // 背景は “そのまま”でOK（ここでは変えない）
    setTimeout(() => {
      if (typeof onDone === "function") onDone();
    }, 480);
  }

  async function startChiBattle(level, { afterWin } = {}) {
    STATE.inChiBattle = true;
    STATE.chiLevel = level;

    // 10択に切り替え
    setQuestionText(`チー娘 Lv${level}「チーと言えば？」`);
    setSpeechText("");

    const labels = makeChi10Choices();

    // Lv3以上は揺らす
    if (shouldShake(level)) document.body.classList.add("chi-shake");
    else document.body.classList.remove("chi-shake");

    // ゲージ表示（チー娘の時だけ！）
    const ms = chiBattleDuration(level);
    startTimer(ms, {
      color: chiBattleColor(level),
      onTimeout: async () => {
        document.body.classList.remove("chi-shake");
        await showGameOver({ chi:true });
      }
    });

    renderChoices(labels, async (pick) => {
      stopTimer();
      disableChoices();
      document.body.classList.remove("chi-shake");

      if (pick === "ギュウ") {
        setSpeechText("ギュウ");
        setTimeout(() => {
          if (typeof afterWin === "function") afterWin();
        }, 380);
      } else {
        setSpeechText("……");
        setTimeout(async () => {
          await showGameOver({ chi:true });
        }, 240);
      }
    });
  }

  /* ========= CHEE MODE (10択連戦) ========= */
  async function startCheeMode() {
    STATE.mode = "chee";
    STATE.stage = 0;
    STATE.inChiBattle = true;
    STATE.chiLevel = 1;

    el.resultBox?.classList.add("hide");

    // 背景をトップ寄り（通常は normal を回す）
    await setBgImage(el.game, girlNormal(currentGirl(), 1));
    showScreen(el.game);

    nextCheeStage();
  }

  function stageToLevel(stage) {
    // stage 1-3 => Lv1, 4-6 => Lv2, 7+ => Lv3
    if (stage <= 3) return 1;
    if (stage <= 6) return 2;
    return 3;
  }

  async function nextCheeStage() {
    STATE.stage++;
    const level = stageToLevel(STATE.stage);
    setCounter(`STAGE ${STATE.stage}`);

    // 背景は適当に回す（A/B/Cは15枚ある前提）
    const g = currentGirl();
    const bgNo = ((STATE.stage - 1) % 15) + 1;
    await setBgImage(el.game, girlNormal(g, bgNo));

    await showChiEntrance(level, () => {
      startChiBattle(level, {
        afterWin: () => {
          // ベスト更新
          const best = getBestStage();
          if (STATE.stage > best) setBestStage(STATE.stage);
          // 次へ
          nextCheeStage();
        }
      });
    });
  }

  /* ========= GIRL SELECT UI ========= */
  function renderGirlGrid() {
    if (!el.girlGrid) return;
    el.girlGrid.innerHTML = "";

    const saved = getSavedGirl();
    girls.forEach((g) => {
      const tile = document.createElement("button");
      tile.type = "button";
      tile.className = "girlTile" + (g.key === saved ? " active" : "") + (g.locked ? " locked" : "");
      tile.dataset.key = g.key;

      const icon = girlIcon(g);

      tile.innerHTML = `
        <div class="iconBox"><img alt="${g.name}" src="${icon}"></div>
        <div class="girlName">${g.name}</div>
        ${g.locked ? `<div class="lockBadge">LOCK</div>` : ``}
      `;

      tile.addEventListener("click", () => {
        // ロックでも選択は可能（表示は出す）／ただしゲーム開始は弾く
        STATE.girlKey = g.key;
        saveGirl(g.key);
        renderGirlGrid();
        // 背景をその子のtopに
        setBgImage(el.girl, girlTop(g));
      });

      el.girlGrid.appendChild(tile);
    });
  }

  /* ========= NAV ========= */
  async function goTop() {
    stopTimer();
    document.body.classList.remove("chi-shake");
    setCounter("-");
    setQuestionText("");
    setSpeechText("");
    el.resultBox?.classList.add("hide");

    // top背景
    // あるなら top_keyvisual_01.png を優先
    await setBgImage(el.top, "top_keyvisual_01.png");
    showScreen(el.top);
  }

  async function goGirlSelect() {
    stopTimer();
    document.body.classList.remove("chi-shake");
    setCounter("-");
    renderGirlGrid();
    const g = currentGirl();
    await setBgImage(el.girl, girlTop(g));
    showScreen(el.girl);
  }

  async function goModeSelect() {
    stopTimer();
    document.body.classList.remove("chi-shake");
    setCounter("-");
    updateBestLine();

    const g = currentGirl();
    await setBgImage(el.mode, girlTop(g));
    showScreen(el.mode);
  }

  function ensureUnlockedForPlay() {
    const g = currentGirl();
    if (!g.locked) return true;
    // ロックは開始不可（でも選択画面は出す）
    alert("この女の子はLOCK中だよ（A〜Cを選んでね）");
    return false;
  }

  /* ========= EVENTS ========= */
  el.btnGoGirl?.addEventListener("click", goGirlSelect);
  el.btnGirlBack?.addEventListener("click", goTop);
  el.btnGoMode?.addEventListener("click", () => {
    if (!ensureUnlockedForPlay()) return;
    goModeSelect();
  });

  el.btnModeBack?.addEventListener("click", goGirlSelect);

  el.btnStartQuiz?.addEventListener("click", () => {
    if (!ensureUnlockedForPlay()) return;
    startQuiz();
  });

  el.btnStartChee?.addEventListener("click", () => {
    if (!ensureUnlockedForPlay()) return;
    startCheeMode();
  });

  /* ========= INIT ========= */
  // 先読み（体感改善）
  (async () => {
    // top keyvisual を先読み
    await preload("top_keyvisual_01.png");
    // A/B/C の icon/top を先読み
    girls.slice(0,3).forEach(g => {
      preload(girlIcon(g));
      preload(girlTop(g));
      preload(girlNormal(g,1));
      preload(girlNormal(g,2));
      preload(girlChiGO(g));
      preload(girlGO(g));
    });
  })();

  goTop();

})();
