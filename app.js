/* =================================
   チーと言えばギュウと答える
   app.js v0.30.6
   ================================= */

/* ---------- VERSION ---------- */
const APP_VERSION = "v0.30.6";
const vEl = document.getElementById("versionVal");
if (vEl) vEl.textContent = APP_VERSION;

/* ---------- STORAGE KEYS ---------- */
const CHEE_RECORD_KEY = "cheeGirlBestStage";     // チー娘BESTステージ
const GIRL_KEY = "selectedGirlKey";              // 選択中の女の子
const ALLSTAR_UNLOCK_KEY = "allstarUnlocked";    // オールスター解放
const CHIGYUTTED_SEEN_KEY = "chigyuttedSeenMap"; // 星マーク用

/* ---------- DOM ---------- */
const $ = (id)=>document.getElementById(id);

const topScreen  = $("topScreen");
const girlScreen = $("girlScreen");
const modeScreen = $("modeScreen");
const gameScreen = $("gameScreen");

const counterEl = $("counter");
const bestLine  = $("bestLine");

const topBg   = topScreen.querySelector(".bg");
const girlBg  = girlScreen.querySelector(".bg");
const modeBg  = modeScreen.querySelector(".bg");
const gameBg  = gameScreen.querySelector(".bg");

const btnGoGirl = $("btnGoGirl");
const btnGirlBack = $("btnGirlBack");
const btnGoMode = $("btnGoMode");
const btnModeBack = $("btnModeBack");
const btnStartQuiz = $("btnStartQuiz");
const btnStartChee = $("btnStartChee");

const girlGrid = $("girlGrid");
const questionEl = $("question");
const speechEl = $("speech");
const choicesEl = $("choices");
const gaugeWrap = $("gaugeWrap");
const gaugeBar  = $("gaugeBar");

/* ---------- UTIL ---------- */
const sleep = (ms)=>new Promise(r=>setTimeout(r,ms));

function show(screen){
  [topScreen,girlScreen,modeScreen,gameScreen].forEach(s=>s.classList.add("hide"));
  screen.classList.remove("hide");
}

function setBgSafe(el, url, fallback){
  const im = new Image();
  im.onload = ()=>{ el.style.backgroundImage = `url("${url}")`; };
  im.onerror = ()=>{ el.style.backgroundImage = fallback ? `url("${fallback}")` : ""; };
  im.src = url;
}

function getBestStage(){
  return Number(localStorage.getItem(CHEE_RECORD_KEY)||0);
}
function setBestStage(v){
  localStorage.setItem(CHEE_RECORD_KEY, String(v));
}
function getSelectedGirl(){
  return localStorage.getItem(GIRL_KEY) || "A";
}
function setSelectedGirl(k){
  localStorage.setItem(GIRL_KEY, k);
}
function getAllstarUnlocked(){
  return localStorage.getItem(ALLSTAR_UNLOCK_KEY)==="1";
}
function getChigyuttedMap(){
  try{ return JSON.parse(localStorage.getItem(CHIGYUTTED_SEEN_KEY)||"{}"); }
  catch(e){ return {}; }
}
function setChigyuttedSeen(k){
  const m = getChigyuttedMap();
  m[k]=true;
  localStorage.setItem(CHIGYUTTED_SEEN_KEY, JSON.stringify(m));
}

/* ---------- GIRLS (A/B/C playable, D/E/F preview only) ---------- */
const GIRLS = {
  A:{
    key:"A", name:"Girl A", playable:true,
    icon:"girlA_icon.png",
    top:"girlA_top_01.png",
    normal: Array.from({length:15},(_,i)=>`girlA_normal_${String(i+1).padStart(2,"0")}.png`),
    clear:  ["girlA_clear_01.png","girlA_clear_02.png","girlA_clear_03.png"],
    over:   ["girlA_gameover_01.png"],
    score:{
      s:["girlA_score_s_01.png","girlA_score_s_02.png","girlA_score_s_03.png"],
      a:["girlA_score_a_01.png","girlA_score_a_02.png","girlA_score_a_03.png"],
      b:["girlA_score_b_01.png","girlA_score_b_02.png","girlA_score_b_03.png"],
      c:["girlA_score_c_01.png","girlA_score_c_02.png","girlA_score_c_03.png"],
      d:["girlA_score_d_01.png","girlA_score_d_02.png","girlA_score_d_03.png"],
    }
  },
  B:{
    key:"B", name:"Girl B", playable:true,
    icon:"girlB_icon.png",
    top:"girlB_top_01.png",
    normal: Array.from({length:15},(_,i)=>`girlB_normal_${String(i+1).padStart(2,"0")}.png`),
    clear:  ["girlB_clear_01.png","girlB_clear_02.png","girlB_clear_03.png"],
    over:   ["girlB_gameover_01.png"],
    score:{
      s:["girlB_score_s_01.png","girlB_score_s_02.png","girlB_score_s_03.png"],
      a:["girlB_score_a_01.png","girlB_score_a_02.png","girlB_score_a_03.png"],
      b:["girlB_score_b_01.png","girlB_score_b_02.png","girlB_score_b_03.png"],
      c:["girlB_score_c_01.png","girlB_score_c_02.png","girlB_score_c_03.png"],
      d:["girlB_score_d_01.png","girlB_score_d_02.png","girlB_score_d_03.png"],
    }
  },
  C:{
    key:"C", name:"Girl C", playable:true,
    icon:"girlC_icon.png",
    top:"girlC_top_01.png",
    normal: Array.from({length:15},(_,i)=>`girlC_normal_${String(i+1).padStart(2,"0")}.png`),
    clear:  ["girlC_clear_01.png","girlC_clear_02.png","girlC_clear_03.png"],
    over:   ["girlC_gameover_01.png"],
    score:{
      s:["girlC_score_s_01.png","girlC_score_s_02.png","girlC_score_s_03.png"],
      a:["girlC_score_a_01.png","girlC_score_a_02.png","girlC_score_a_03.png"],
      b:["girlC_score_b_01.png","girlC_score_b_02.png","girlC_score_b_03.png"],
      c:["girlC_score_c_01.png","girlC_score_c_02.png","girlC_score_c_03.png"],
      d:["girlC_score_d_01.png","girlC_score_d_02.png","girlC_score_d_03.png"],
    }
  },
  D:{ key:"D", name:"Girl D", playable:false, icon:"girlD_icon.png", top:"girlD_top_01.png" },
  E:{ key:"E", name:"Girl E", playable:false, icon:"girlE_icon.png", top:"girlE_top_01.png" },
  F:{ key:"F", name:"Girl F", playable:false, icon:"girlF_icon.png", top:"girlF_top_01.png" },
};

/* ---------- PRELOAD (smooth) ---------- */
function preload(list){
  list.forEach(src=>{ const i=new Image(); i.src=src; });
}

/* ---------- QUESTIONS ---------- */
const Q1 = "あなたはチー牛ですか？";
const Q25 = "最後にひとこと。チーと言えば？";

function makeQuestions(){
  const mids = [
    "知らない人を一瞬見てしまったことは？",
    "人混みが少し苦手？",
    "好きな丼ものは？",
    "自分は優しいと思う？",
    "考えすぎるタイプ？",
    "今日はインドア気分？",
    "こだわりは強い？",
    "静かな場所が好き？",
    "新作は様子見派？",
    "深夜テンションになる？",
    "通知は溜めがち？",
    "推しはいる？",
    "一人時間は大事？",
    "説明書は読む？",
    "並ぶのは苦手？",
    "細かい所に気づく？",
    "ゲームは慎重派？",
    "熱中すると周り見えない？",
    "予定変更は苦手？",
    "写真撮るの少なめ？",
    "新しい事は少し不安？",
    "夜更かししがち？",
    "省エネ行動が好き？",
  ];
  const qs = [Q1, ...mids.slice(0,23), Q25];
  return qs;
}

/* ---------- STATE ---------- */
let mode = "quiz"; // quiz / chee
let qIndex = 0;
let questions = [];
let cheeLevel = 0;
let cheeAppearCount = 0;

/* ---------- UI BUILD ---------- */
function buildGirlGrid(){
  girlGrid.innerHTML="";
  const seen = getChigyuttedMap();
  Object.values(GIRLS).forEach(g=>{
    const tile=document.createElement("div");
    tile.className="girlTile";
    tile.innerHTML=`
      <div class="iconBox"><img src="${g.icon}"></div>
      <div class="girlName">${g.name}</div>
      ${!g.playable?`<div class="lockBadge">LOCK</div>`:""}
      ${seen[g.key]?`<div class="lockBadge" style="top:auto;bottom:10px;">★</div>`:""}
    `;
    tile.onclick=()=>{
      if(!g.playable) return;
      document.querySelectorAll(".girlTile").forEach(t=>t.classList.remove("active"));
      tile.classList.add("active");
      setSelectedGirl(g.key);
      setBgSafe(girlBg, g.top, "girl_top.png");
    };
    girlGrid.appendChild(tile);
  });
}

/* ---------- GAME FLOW ---------- */
async function showCheeAppear(){
  speechEl.textContent = "チー娘登場";
  await sleep(600); // ← 必ず見せる
  speechEl.textContent = "";
}

function startGauge(color){
  gaugeBar.className = "";
  gaugeBar.classList.add(color);
  gaugeWrap.classList.add("show");
  gaugeBar.style.transform="scaleX(0)";
  // reflow
  gaugeBar.offsetWidth;
  gaugeBar.style.transition="transform 1.1s linear";
  gaugeBar.style.transform="scaleX(1)";
}

function shakeIfNeeded(){
  if(cheeLevel>=3){
    gameScreen.classList.remove("shake");
    gameScreen.offsetWidth;
    gameScreen.classList.add("shake");
    setTimeout(()=>gameScreen.classList.remove("shake"),300);
  }
}

function renderQuestion(){
  const g = GIRLS[getSelectedGirl()];
  counterEl.textContent = `${qIndex+1}/25`;
  questionEl.textContent = questions[qIndex];
  setBgSafe(gameBg, g.normal[qIndex%g.normal.length], g.top);

  choicesEl.innerHTML="";
  ["はい","いいえ","ギュウ","チー"].forEach(label=>{
    const b=document.createElement("button");
    b.className="choice";
    b.textContent=label;
    b.onclick=()=>onAnswer(label);
    choicesEl.appendChild(b);
  });
}

async function onAnswer(ans){
  // Q25 rule
  if(qIndex===24 && ans!=="ギュウ"){
    endGame(false);
    return;
  }

  // Chee battle
  if(mode==="chee"){
    cheeLevel++;
    cheeAppearCount++;
    await showCheeAppear();
    startGauge(cheeLevel>=3?"red":"yellow");
    shakeIfNeeded();
    await sleep(1200);
    nextQ();
    return;
  }

  // Quiz mode chee invasion (guarantee 3 times)
  if(cheeAppearCount<3 && (qIndex===5||qIndex===12||qIndex===18)){
    cheeAppearCount++;
    await showCheeAppear();
    startGauge("yellow");
    await sleep(1200);
  }

  nextQ();
}

function nextQ(){
  qIndex++;
  if(qIndex>=25){
    endGame(true);
    return;
  }
  renderQuestion();
}

function endGame(clear){
  const g = GIRLS[getSelectedGirl()];
  setBgSafe(gameBg, clear? g.clear[0] : g.over[0], g.top);
}

/* ---------- STARTERS ---------- */
btnGoGirl.onclick=()=>{
  setBgSafe(girlBg,"girl_top.png","girl_top.png");
  buildGirlGrid();
  show(girlScreen);
};

btnGirlBack.onclick=()=>show(topScreen);

btnGoMode.onclick=()=>{
  const g = GIRLS[getSelectedGirl()];
  setBgSafe(modeBg, g.top, "girl_top.png");
  bestLine.textContent = `チー娘 BEST：ステージ${getBestStage()}`;
  show(modeScreen);
};

btnModeBack.onclick=()=>show(girlScreen);

btnStartQuiz.onclick=()=>{
  mode="quiz";
  startGame();
};

btnStartChee.onclick=()=>{
  mode="chee";
  startGame();
};

function startGame(){
  qIndex=0; cheeLevel=0; cheeAppearCount=0;
  questions = makeQuestions();
  gaugeWrap.classList.remove("show");
  preload(GIRLS[getSelectedGirl()].normal);
  show(gameScreen);
  renderQuestion();
}

/* ---------- INIT ---------- */
setBgSafe(topBg,"top_keyvisual_01.png","girl_top.png");
show(topScreen);
