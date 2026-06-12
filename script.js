// ===========================
// 上部：設定・初期化
// ===========================

// const = 変更しない値を入れる変数。ゲーム時間は60秒固定
const GAME_TIME = 60;

// ===== ゲームの状態（state）=====
// let = 後から値が変わる変数
// オブジェクト（{}）でゲームに必要な情報をまとめて管理する
let state = {
  currentWord: "",      // 今表示している問題の単語
  currentDesc: "",      // 今表示している問題の説明文
  typedText: "",        // プレイヤーが正しく打った文字（進捗）
  correctCount: 0,      // 正答した問題数
  missCount: 0,         // ミスタイプした回数
  totalTyped: 0,        // 正しく入力した文字の総数（正確率の計算に使う）
  timeLeft: GAME_TIME,  // 残り時間（秒）
  isPlaying: false,     // ゲーム中かどうかのフラグ（true/false）
  startTime: null,      // ゲーム開始時刻（WPM計算に使う）
  timerInterval: null,  // setInterval の戻り値（後でclearするために保持）
};

// ===== DOM要素の取得 =====
// document.getElementById("id名") でHTMLの要素をJSから操作できるようにする
// 変数に入れておくことで、毎回 getElementById を書かなくて済む

// 3つの画面をまとめてオブジェクトで管理
const screens = {
  start:  document.getElementById("screen-start"),
  play:   document.getElementById("screen-play"),
  result: document.getElementById("screen-result"),
};

const elTimer        = document.getElementById("timer");         // タイマー表示
const elCorrect      = document.getElementById("correct-count"); // 正答数表示
const elMiss         = document.getElementById("miss-count");    // ミス数表示
const elWordDesc     = document.getElementById("word-desc");     // 問題の説明文
const elWordDisplay  = document.getElementById("word-display");  // 問題の単語本体
const elWordProgress = document.getElementById("word-progress"); // 入力中の進捗（色分け）
const elInput        = document.getElementById("type-input");    // テキスト入力欄
const elGenre        = document.getElementById("genre-select");  // ジャンル選択
const elResCorrect   = document.getElementById("res-correct");   // リザルト：正答数
const elResMiss      = document.getElementById("res-miss");      // リザルト：ミス数
const elResWpm       = document.getElementById("res-wpm");       // リザルト：WPM
const elResAccuracy  = document.getElementById("res-accuracy");  // リザルト：正確率


// ===========================
// 中部：イベントリスナー
// ===========================

// addEventListener("イベント名", 関数) → ユーザーの操作に関数を紐づける
document.getElementById("btn-start").addEventListener("click", startGame);  // スタートボタン押下
document.getElementById("btn-retry").addEventListener("click", startGame);  // もう一度ボタン押下
document.getElementById("btn-end").addEventListener("click", abortGame);    // 終了ボタン押下
elInput.addEventListener("input", handleInput);                              // キーボード入力
elGenre.addEventListener("change", () => {                                   // ジャンル変更 → プレイ中なら即リスタート
  if (state.isPlaying) startGame();
});


// ===========================
// 下部：関数の具体的な中身
// ===========================

// ===== ゲーム開始 =====
// スタートボタン・もう一度ボタン・ジャンル変更時に呼ばれる
function startGame() {
  // stateをリセット（全スコアを0に戻す）
  state = {
    currentWord: "",
    currentDesc: "",
    typedText: "",
    correctCount: 0,
    missCount: 0,
    totalTyped: 0,
    timeLeft: GAME_TIME,
    isPlaying: true,
    startTime: Date.now(), // 現在時刻をミリ秒で記録（WPM計算用）
    timerInterval: null,
  };

  showScreen("play"); // プレイ中画面に切り替え
  nextWord();         // 最初の問題を出題
  updateStatus();     // ステータスバーを初期値で更新
  elInput.value = ""; // 入力欄をクリア
  elInput.focus();    // 入力欄にフォーカス（すぐ入力できるように）

  // setInterval(関数, ミリ秒) → 1000ms（1秒）ごとに tick() を実行
  // 戻り値（ID）を state に保存しておくことで後から停止できる
  state.timerInterval = setInterval(tick, 1000);
}

// ===== 画面切り替え =====
// name に "start" / "play" / "result" を渡すと、その画面だけ active クラスがつく
// classList.toggle(クラス名, 条件) → 条件がtrueならadd、falseならremove
function showScreen(name) {
  Object.entries(screens).forEach(([key, el]) => {
    el.classList.toggle("active", key === name);
  });
}

// ===== タイマー処理（1秒ごとに呼ばれる）=====
function tick() {
  state.timeLeft -= 1;  // 残り時間を1秒減らす
  updateStatus();       // 画面のタイマー表示を更新
  if (state.timeLeft <= 0) endGame(); // 0秒になったらゲーム終了
}

// ===== 次の問題を出す =====
function nextWord() {
  const genre = elGenre.value;           // 現在選択されているジャンル（"git" など）
  const list = wordList[genre];          // そのジャンルの単語リストを取得（words.jsで定義）

  // Math.random() → 0以上1未満のランダムな小数
  // Math.floor() → 小数を切り捨てて整数に
  // → リストの中からランダムに1つ選ぶ
  const item = list[Math.floor(Math.random() * list.length)];

  state.currentWord = item.word; // 選んだ単語を state に保存
  state.currentDesc = item.desc; // 説明文を state に保存
  state.typedText = "";          // 入力進捗をリセット
  elInput.value = "";            // 入力欄もクリア
  renderWord();                  // 画面を更新
}

// ===== キーボード入力の処理 =====
// input イベント → 入力欄の内容が変わるたびに発火する
function handleInput(e) {
  if (!state.isPlaying) return; // ゲーム中でなければ何もしない

  const typed    = e.target.value;    // 入力欄の現在の文字列
  const expected = state.currentWord; // 正解の単語

  // 次に打つべき文字のインデックス（何文字目か）
  const nextIndex = state.typedText.length;
  const nextChar  = expected[nextIndex]; // 次に打つべき1文字

  // 最後に追加された1文字を取り出す
  const lastTyped = typed[typed.length - 1];

  // バックスペース対策：入力が減った場合は入力欄を戻す（削除は許可しない）
  if (typed.length < state.typedText.length) {
    elInput.value = state.typedText;
    return;
  }

  if (lastTyped === nextChar) {
    // ===== 正解 =====
    state.typedText += lastTyped; // 進捗に1文字追加
    state.totalTyped++;           // 正しく打った文字数を加算
    elInput.classList.remove("miss"); // ミス演出があれば解除

    if (state.typedText === expected) {
      // 単語を全部打ち切ったら正答
      state.correctCount++;
      nextWord(); // 次の問題へ
    } else {
      renderWord(); // まだ途中なので進捗表示を更新
    }
  } else {
    // ===== ミスタイプ =====
    state.missCount++;               // ミス数を加算
    elInput.value = state.typedText; // 誤入力を取り消す（正しい進捗まで戻す）
    flashMiss();                     // 赤フラッシュ演出
  }

  updateStatus(); // ステータスバーを更新
}

// ===== ミスタイプ演出 =====
// 入力欄の枠線を一瞬赤くする
function flashMiss() {
  elInput.classList.add("miss"); // CSSで枠線が赤になる
  // setTimeout(関数, ミリ秒) → 150ms後に1回だけ実行
  setTimeout(() => elInput.classList.remove("miss"), 150);
}

// ===== 入力進捗の描画 =====
// 打った文字=緑、次の文字=青カーソル、残り=グレー で表示する
function renderWord() {
  const word  = state.currentWord;
  const typed = state.typedText;
  let html = "";

  // 単語の文字を1文字ずつループして span タグで色分け
  for (let i = 0; i < word.length; i++) {
    // スペースはそのままだと表示されないので &nbsp; に変換
    const ch = word[i] === " " ? "&nbsp;" : word[i];

    if (i < typed.length) {
      html += `<span class="correct">${ch}</span>`; // 打済み → 緑
    } else if (i === typed.length) {
      html += `<span class="cursor">${ch}</span>`;  // 次に打つ文字 → 青下線
    } else {
      html += `<span class="pending">${ch}</span>`; // まだ → グレー
    }
  }

  // テンプレートリテラル（`）と ${} で変数を文字列に埋め込む
  elWordDesc.textContent    = state.currentDesc; // 説明文を更新
  elWordDisplay.textContent = word;              // 単語本体を更新
  elWordProgress.innerHTML  = html;              // 色分けHTMLを流し込む（innerHTMLはタグを有効にする）
}

// ===== ステータスバーの更新 =====
function updateStatus() {
  elTimer.textContent   = `⏱ ${state.timeLeft}秒`;
  elCorrect.textContent = `✓ ${state.correctCount}問`;
  elMiss.textContent    = `❌ ${state.missCount}`;
}

// ===== ゲーム終了（タイムアップ）=====
function endGame() {
  clearInterval(state.timerInterval); // タイマーを止める
  state.isPlaying = false;

  // WPM（1分あたりの単語数）を計算
  // Date.now() で現在時刻を取得し、開始時刻との差をミリ秒→分に変換
  const elapsed = (Date.now() - state.startTime) / 1000 / 60; // 経過時間（分）
  // 三項演算子：elapsed > 0 なら計算、そうでなければ 0
  const wpm = elapsed > 0 ? Math.round(state.correctCount / elapsed) : 0;

  // 正確率 = 正しく打った文字 ÷ 総入力文字 × 100
  const accuracy = state.totalTyped > 0
    ? Math.round(((state.totalTyped - state.missCount) / state.totalTyped) * 100)
    : 100;

  // リザルト画面の各スコアを書き換える
  elResCorrect.textContent  = state.correctCount;
  elResMiss.textContent     = state.missCount;
  elResWpm.textContent      = wpm;
  elResAccuracy.textContent = `${accuracy}%`;

  showScreen("result"); // リザルト画面に切り替え
}

// ===== ゲーム中断（終了ボタン）=====
// タイムアップを待たずにスタート画面に戻る
function abortGame() {
  clearInterval(state.timerInterval); // タイマーを止める
  state.isPlaying = false;
  showScreen("start"); // スタート画面に戻る
}
