/* =========================
   チーと言えばギュウと答える
   app.js v0.30.6
   ========================= */

/* VERSION */
const APP_VERSION = "v0.30.6";
document.getElementById("versionVal").textContent = APP_VERSION;

/* 保存キー */
const CHEE_RECORD_KEY = "cheeGirlBestStage";
const GIRL_KEY = "selectedGirlKey";
const GIRL_PREVIEW_KEY = "girlPreviewBgKey";

function getBestStage(){ return Number(localStorage.getItem(CHEE_RECORD_KEY)) || 0; }
function setBestStage(stage){ localStorage.setItem(CHEE_RECORD_KEY, String(stage)); }
function getSavedGirl(){ return localStorage.getItem(GIRL_KEY) || "A"; }
function saveGirl(g){ localStorage.setItem(GIRL_KEY, g); }
function getPreviewKey(){ return localStorage.getItem(GIRL_PREVIEW_KEY) || ""; }
function setPreviewKey(k){ localStorage.setItem(GIRL_PREVIEW_KEY, k); }

/* 女の子定義 */
function makeGirl(prefix, key, name, locked=false, chiOverText="……"){
  const normal = Array.from({length:15}, (_,i)=> `${prefix}_normal_${String(i+1).padStart(2,"0")}.png`);
  return {
    key, name, locked,
    icon: `${prefix}_icon.png`,
    top:  `${prefix}_top_01.png`,
    normal,
    gameover: `${prefix}_gameover_01.png`,
    chiGameover: `${prefix}_chi_gameover_01.png`,
    chiOverText,
    score: {
      s: Array.from({length:3}, (_,i)=> `${prefix}_score_s_${String(i+1).padStart(2,"0")}.png`),
      a: Array.from({length:3}, (_,i)=> `${prefix}_score_a_${String(i+1).padStart(2,"0")}.png`),
      b: Array.from({length:3}, (_,i)=> `${prefix}_score_b_${String(i+1).padStart(2,"0")}.png`)
    }
  };
}

const GIRLS = [
  makeGirl("girlA","A","Girl A", false, "……（チー娘Aは無言で去っていった）"),
  makeGirl("girlB","B","Girl B", false, "……（チー娘B：見なかったことにするね）"),
  makeGirl("girlC","C","Girl C", false, "……（チー娘C：次はちゃんとして？）"),
  makeGirl("girlD","D","Girl D", true,  "（LOCKED）"),
  makeGirl("girlE","E","Girl E", true,  "（LOCKED）"),
  makeGirl("girlF","F","Girl F", true,  "（LOCKED）")
];

let selectedGirlKey = getSavedGirl();

/* =========================
   問題（25問固定）
========================= */
const questionsAll = [
  { text:"あなたはチー牛ですか？" },
  { text:"チーと言えば？" },
  { text:"チーズ牛丼を頼んだ人の顔をついチラ見してしまった事はありますか？" },
  { text:"知らない人を見て『チー牛かも』と思ってしまったことはありますか？" },
  { text:"あなたの友人にチー牛はいますか？" },
  { text:"『チー』と聞こえたら反射的に『ギュウ』が頭に浮かびますか？" },
  { text:"『ギュウ』と言う時、なぜか誇らしい気持ちになりますか？" },
  { text:"チーズ牛丼を食べた後、ちょっと強くなった気がしますか？" },
  { text:"チーと言われると、少しだけ反応してしまいますか？" },
  { text:"『チー牛』という言葉を、心の中だけで使ったことはありますか？" },
  { text:"あなたはチー牛を『悪口』ではなく『概念』だと思いますか？" },
  { text:"チーズ牛丼を『恥ずかしくて頼めない』人は実在すると思いますか？" },
  { text:"あなたは『頼めないが、本当は食べたい』側ですか？" },
  { text:"チーズ牛丼を頼む人を見ると、なぜか目が行きますか？" },
  { text:"『チー牛かも』と思っても、口には出しませんか？" },
  { text:"『チーと言えばギュウ』と聞いて、少し安心しますか？" },
  { text:"あなたは自分がチー牛かどうか、時々確認したくなりますか？" },
  { text:"『チー』と『ギュウ』の関係は、もはや運命だと思いますか？" },
  { text:"『チーと言えばギュウ』は、人生のセーフティネットだと思いますか？" },
  { text:"チーと言われたら、ギュウと返したいですか？" },
  { text:"ギュウと言ったら、相手に❤で返してほしいですか？" },
  { text:"『ギュウ』と答えると世界が少し平和になると思いますか？" },
  { text:"あなたは『ギュウ』と答える練習をしたことがありますか？" },
  { text:"チー牛という言葉をここまで真剣に考えたことはありますか？" },
  { text:"最後にひとこと。チーと言えば？" }
];

const QUESTIONS_LIMIT = 25;
const questions = questionsAll.slice(0, QUESTIONS_LIMIT);

/* =========================
   チー娘レベル
========================= */
const cheeLevelsNormal = [
  { stars:1, timeMs:2400, gauge:"cool" },
  { stars:2, timeMs:1700, gauge:"yellow" },
  { stars:3, timeMs:1200, gauge:"red" }
];

/* ★ 最低3回保証（Lv1→2→3） */
let forcedCheeQueue = [
  cheeLevelsNormal[0],
  cheeLevelsNormal[1],
  cheeLevelsNormal[2]
];

/* =========================
   DOM
========================= */
const counterEl   = document.getElementById("counter");

const topScreen   = document.getElementById("topScreen");
const girlScreen  = document.getElementById("girlScreen");
const modeScreen  = document.getElementById("modeScreen");
const gameScreen  = document.getElementById("gameScreen");

const girlBg      = document.querySelector("#girlScreen .bg");
const modeBg      = document.querySelector("#modeScreen .bg");
const gameBg      = document.querySelector("#gameScreen .bg");

const girlGrid    = document.getElementById("girlGrid");
const bestLine    = document.getElementById("bestLine");

const qEl         = document.getElementById("question");
const speechEl    = document.getElementById("speech");
const choicesEl   = document.getElementById("choices");

const gaugeWrap   = document.getElementById("gaugeWrap");
const gaugeBar    = document.getElementById("gaugeBar");

const resultBox   = document.getElementById("resultBox");
const resultPct   = document.getElementById("resultPct");

/* =========================
   状態
========================= */
let i = 0;
let ended = false;
let locked = false;
let mode = "quiz";

/* =========================
   utils
========================= */
function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function shuffle(a){ return a.slice().sort(()=>Math.random()-0.5); }
function getGirlByKey(k){ return GIRLS.find(x=>x.key===k) || GIRLS[0]; }
function getSelectedGirl(){ return getGirlByKey(selectedGirlKey); }

/* =========================
   画面遷移
========================= */
function showOnly(screen){
  [topScreen,girlScreen,modeScreen,gameScreen].forEach(s=>s.classList.add("hide"));
  screen.classList.remove("hide");
}

function goTop(){
  ended=false; locked=false;
  counterEl.textContent="-";
  showOnly(topScreen);
}

function goGirlSelect(){
  renderGirlGrid();
  setGirlAndModeBgToSelectedTop();
  showOnly(girlScreen);
}

function goModeSelect(){
  bestLine.textContent = `チー娘 BEST：ステージ${getBestStage()}`;
  setGirlAndModeBgToSelectedTop();
  showOnly(modeScreen);
}

/* =========================
   女の子選択
========================= */
function renderGirlGrid(){
  girlGrid.innerHTML="";
  GIRLS.forEach(g=>{
    const tile=document.createElement("button");
    tile.className="girlTile"+(g.key===selectedGirlKey?" active":"")+(g.locked?" locked":"");
    tile.onclick=()=>{
      if(g.locked) return;
      selectedGirlKey=g.key;
      saveGirl(g.key);
      setGirlAndModeBgToSelectedTop();
      renderGirlGrid();
    };
    tile.innerHTML=`
      <div class="iconBox"><img src="${g.icon}"></div>
      <div class="girlName">${g.name}</div>
      ${g.locked?`<div class="lockBadge">LOCK</div>`:""}
    `;
    girlGrid.appendChild(tile);
  });
}

function setGirlAndModeBgToSelectedTop(){
  const g=getSelectedGirl();
  girlBg.style.backgroundImage=`url("${g.top}")`;
  modeBg.style.backgroundImage=`url("${g.top}")`;
}

/* =========================
   ゲーム
========================= */
function applyGameBg(){
  const g=getSelectedGirl();
  gameBg.style.backgroundImage=`url("${g.normal[i%g.normal.length]}")`;
}

function buildChoices(){
  choicesEl.innerHTML="";
  shuffle(["はい","いいえ","チー","ギュウ"]).forEach(t=>{
    const b=document.createElement("button");
    b.className="choice";
    b.textContent=t;
    b.onclick=()=>answer(t);
    choicesEl.appendChild(b);
  });
}

function showQuestion(){
  locked=false;
  applyGameBg();
  qEl.textContent=questions[i].text;
  counterEl.textContent=`${i+1}/${questions.length}`;
  buildChoices();
}

function maybeChee(){
  if(forcedCheeQueue.length>0){
    startCheeBattle(forcedCheeQueue.shift());
    return;
  }
  i++;
  if(i<questions.length) showQuestion();
  else endResult();
}

function startCheeBattle(level){
  mode="chee";
  gaugeWrap.classList.add("show");
  gaugeBar.className="";
  if(level.gauge==="yellow") gaugeBar.classList.add("yellow");
  if(level.gauge==="red") gaugeBar.classList.add("red");
  let start=performance.now();
  function tick(t){
    const r=Math.max(0,1-(t-start)/level.timeMs);
    gaugeBar.style.transform=`scaleX(${r})`;
    if(r>0) requestAnimationFrame(tick);
    else gameOver();
  }
  requestAnimationFrame(tick);
}

function answer(t){
  if(locked||ended) return;
  locked=true;

  if(mode==="chee"){
    if(t==="ギュウ"){
      gaugeWrap.classList.remove("show");
      mode="quiz";
      maybeChee();
    }else{
      gameOver();
    }
    return;
  }

  const isLast = (i === questions.length-1);
  if(isLast && t!=="ギュウ"){
    gameOver();
    return;
  }
  maybeChee();
}

function endResult(){
  ended=true;
  counterEl.textContent="RESULT";
  resultBox.classList.remove("hide");
  const score = 80+Math.floor(Math.random()*20);
  resultPct.innerHTML=`${score}<small>%</small>`;
}

function gameOver(){
  ended=true;
  counterEl.textContent="GAME OVER";
}

/* =========================
   init
========================= */
document.getElementById("btnGoGirl").onclick=goGirlSelect;
document.getElementById("btnGirlBack").onclick=goTop;
document.getElementById("btnGoMode").onclick=goModeSelect;
document.getElementById("btnModeBack").onclick=goGirlSelect;
document.getElementById("btnStartQuiz").onclick=()=>{ i=0; showOnly(gameScreen); showQuestion(); };

goTop();
