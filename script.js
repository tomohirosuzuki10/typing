const GAME_TIME = 60;

let state = {
  currentWord: "",
  currentDesc: "",
  typedText: "",
  correctCount: 0,
  missCount: 0,
  totalTyped: 0,
  timeLeft: GAME_TIME,
  isPlaying: false,
  startTime: null,
  timerInterval: null,
};

// --- DOM ---
const screens = {
  start:  document.getElementById("screen-start"),
  play:   document.getElementById("screen-play"),
  result: document.getElementById("screen-result"),
};
const elTimer        = document.getElementById("timer");
const elCorrect      = document.getElementById("correct-count");
const elMiss         = document.getElementById("miss-count");
const elWordDesc     = document.getElementById("word-desc");
const elWordDisplay  = document.getElementById("word-display");
const elWordProgress = document.getElementById("word-progress");
const elInput        = document.getElementById("type-input");
const elGenre        = document.getElementById("genre-select");
const elResCorrect   = document.getElementById("res-correct");
const elResMiss      = document.getElementById("res-miss");
const elResWpm       = document.getElementById("res-wpm");
const elResAccuracy  = document.getElementById("res-accuracy");

// --- 画面切り替え ---
function showScreen(name) {
  Object.entries(screens).forEach(([key, el]) => {
    el.classList.toggle("active", key === name);
  });
}

// --- ゲーム開始 ---
function startGame() {
  state = {
    currentWord: "",
    currentDesc: "",
    typedText: "",
    correctCount: 0,
    missCount: 0,
    totalTyped: 0,
    timeLeft: GAME_TIME,
    isPlaying: true,
    startTime: Date.now(),
    timerInterval: null,
  };

  showScreen("play");
  nextWord();
  updateStatus();
  elInput.value = "";
  elInput.focus();

  state.timerInterval = setInterval(tick, 1000);
}

// --- タイマー ---
function tick() {
  state.timeLeft -= 1;
  updateStatus();
  if (state.timeLeft <= 0) endGame();
}

// --- 次の問題 ---
function nextWord() {
  const genre = elGenre.value;
  const list = wordList[genre];
  const item = list[Math.floor(Math.random() * list.length)];
  state.currentWord = item.word;
  state.currentDesc = item.desc;
  state.typedText = "";
  elInput.value = "";
  renderWord();
}

// --- 入力ハンドラ ---
elInput.addEventListener("input", (e) => {
  if (!state.isPlaying) return;

  const typed = e.target.value;
  const expected = state.currentWord;

  // 期待する次の1文字と照合
  const nextIndex = state.typedText.length;
  const nextChar = expected[nextIndex];

  // 最後に追加された文字
  const lastTyped = typed[typed.length - 1];

  if (typed.length < state.typedText.length) {
    // バックスペース — 何もしない（削除不可にするため入力を戻す）
    elInput.value = state.typedText;
    return;
  }

  if (lastTyped === nextChar) {
    state.typedText += lastTyped;
    state.totalTyped++;
    elInput.classList.remove("miss");

    if (state.typedText === expected) {
      state.correctCount++;
      nextWord();
    } else {
      renderWord();
    }
  } else {
    state.missCount++;
    elInput.value = state.typedText;
    flashMiss();
  }

  updateStatus();
});

// --- ミス演出 ---
function flashMiss() {
  elInput.classList.add("miss");
  setTimeout(() => elInput.classList.remove("miss"), 150);
}

// --- 入力進捗の描画 ---
function renderWord() {
  const word = state.currentWord;
  const typed = state.typedText;
  let html = "";

  for (let i = 0; i < word.length; i++) {
    const ch = word[i] === " " ? "&nbsp;" : word[i];
    if (i < typed.length) {
      html += `<span class="correct">${ch}</span>`;
    } else if (i === typed.length) {
      html += `<span class="cursor">${ch}</span>`;
    } else {
      html += `<span class="pending">${ch}</span>`;
    }
  }

  elWordDesc.textContent = state.currentDesc;
  elWordDisplay.textContent = word;
  elWordProgress.innerHTML = html;
}

// --- ステータス更新 ---
function updateStatus() {
  elTimer.textContent = `⏱ ${state.timeLeft}秒`;
  elCorrect.textContent = `✓ ${state.correctCount}問`;
  elMiss.textContent = `❌ ${state.missCount}`;
}

// --- ゲーム終了 ---
function endGame() {
  clearInterval(state.timerInterval);
  state.isPlaying = false;

  const elapsed = (Date.now() - state.startTime) / 1000 / 60; // 分
  const wpm = elapsed > 0 ? Math.round(state.correctCount / elapsed) : 0;
  const accuracy = state.totalTyped > 0
    ? Math.round(((state.totalTyped - state.missCount) / state.totalTyped) * 100)
    : 100;

  elResCorrect.textContent = state.correctCount;
  elResMiss.textContent = state.missCount;
  elResWpm.textContent = wpm;
  elResAccuracy.textContent = `${accuracy}%`;

  showScreen("result");
}

// --- ボタン ---
document.getElementById("btn-start").addEventListener("click", startGame);
document.getElementById("btn-retry").addEventListener("click", startGame);
