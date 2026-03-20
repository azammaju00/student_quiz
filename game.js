// ===== CONFIG =====
const QUESTIONS_URL = "https://student-quiz-4wu4.onrender.com/api/questions";
const SAVE_API = "https://student-quiz-4wu4.onrender.com/api/submit";

// ===== GLOBAL =====
let questions = [];
let filteredQuestions = [];
let currentIndex = 0;
let selectedAnswer = null;
let correctCount = 0;
let startTime = Date.now();
let isLocked = false;

// ===== AUDIO =====
let musicEnabled = true;
let musicStarted = false;

const clickSound = new Audio("./audio/optionSound.wav");
clickSound.volume = 0.35;

const nextSound = new Audio("./audio/nextQuestionSound.wav");
nextSound.volume = 0.35;

const correctSound = new Audio("./audio/correctSound.mp3");
correctSound.volume = 0.4;

const wrongSound = new Audio("./audio/wrongSound.mp3");
wrongSound.volume = 0.4;

const bgm = new Audio("./audio/backgroundMusic.mp3");
bgm.volume = 0.12;
bgm.loop = true;

// ===== GET PARAM =====
const params = new URLSearchParams(window.location.search);
const year = params.get("year");
const subject = params.get("subject");
const group = params.get("group");

console.log("year:", year);
console.log("subject:", subject);
console.log("group:", group);

// ===== AUDIO FUNCTIONS =====
function playClickSound() {
  if (!musicEnabled) return;

  clickSound.currentTime = 0;
  clickSound.play().catch(err => {
    console.log("点击音效播放失败:", err);
  });
}

function playNextSound() {
  if (!musicEnabled) return;

  nextSound.currentTime = 0;
  nextSound.play().catch(err => {
    console.log("下一题音效播放失败:", err);
  });
}

function playCorrectSound() {
  if (!musicEnabled) return;

  correctSound.currentTime = 0;
  correctSound.play().catch(err => {
    console.log("正确音效播放失败:", err);
  });
}

function playWrongSound() {
  if (!musicEnabled) return;

  wrongSound.currentTime = 0;
  wrongSound.play().catch(err => {
    console.log("错误音效播放失败:", err);
  });
}

function startBgm() {
  if (!musicEnabled) return;
  if (musicStarted) return;

  bgm.play()
    .then(() => {
      musicStarted = true;
    })
    .catch(err => {
      console.log("背景音乐播放失败:", err);
    });
}

function updateMusicButton() {
  const btn = document.getElementById("musicToggle");
  if (!btn) return;

  if (musicEnabled) {
    btn.innerText = "🔊 音乐开";
    btn.classList.remove("off");
  } else {
    btn.innerText = "🔇 音乐关";
    btn.classList.add("off");
  }
}

function toggleMusic() {
  musicEnabled = !musicEnabled;

  if (musicEnabled) {
    updateMusicButton();

    bgm.play()
      .then(() => {
        musicStarted = true;
      })
      .catch(err => {
        console.log("背景音乐播放失败:", err);
      });
  } else {
    bgm.pause();
    updateMusicButton();
  }
}

// ===== LOAD QUESTIONS =====
async function loadQuestions() {
  try {
    const res = await fetch(QUESTIONS_URL);
    const raw = await res.json();

    console.log("原始题库:", raw);

    questions = raw;
    startTime = Date.now();

    filterQuestions();
  } catch (err) {
    console.error("读取题库失败", err);
  }
}

// ===== FILTER =====
function filterQuestions() {
  filteredQuestions = questions.filter(q => {
    return q.year === year && q.subject === subject;
  });

  console.log("过滤后的题目:", filteredQuestions);

  if (filteredQuestions.length === 0) {
    document.getElementById("question").innerText = "⚠️ 没有符合条件的题目";
    document.getElementById("options").style.display = "none";
    document.getElementById("nextBtn").style.display = "none";
    return;
  }

  showQuestion();
}

// ===== RESET OPTION STATE =====
function resetOptionState() {
  selectedAnswer = null;
  isLocked = false;

  document.querySelectorAll(".option").forEach(btn => {
    btn.classList.remove("selected", "correct", "wrong");
    btn.disabled = false;
    btn.blur();
  });

  if (document.activeElement) {
    document.activeElement.blur();
  }
}

// ===== SHOW QUESTION =====
function showQuestion() {
  const q = filteredQuestions[currentIndex];
  if (!q) return;

  resetOptionState();

  console.log("当前题目:", q);

  document.getElementById("progress").innerText =
    `${currentIndex + 1} / ${filteredQuestions.length}`;

  document.getElementById("question").innerText = q.question;

  document.getElementById("A").innerText = q.optionA ?? "";
  document.getElementById("B").innerText = q.optionB ?? "";
  document.getElementById("C").innerText = q.optionC ?? "";
  document.getElementById("D").innerText = q.optionD ?? "";
}

// ===== SELECT ANSWER =====
function selectAnswer(letter) {
  if (isLocked) return;

  selectedAnswer = letter;

  startBgm();
  playClickSound();

  console.log("选择:", letter);

  document.querySelectorAll(".option").forEach(btn => {
    btn.classList.remove("selected");
  });

  document.getElementById("opt" + letter).classList.add("selected");
}

// ===== FORMAT TIME =====
function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}分${seconds.toString().padStart(2, "0")}秒`;
}

// ===== GET SELECTED OPTION TEXT =====
function getSelectedOptionText(q, letter) {
  if (letter === "A") return String(q.optionA ?? "").trim();
  if (letter === "B") return String(q.optionB ?? "").trim();
  if (letter === "C") return String(q.optionC ?? "").trim();
  if (letter === "D") return String(q.optionD ?? "").trim();
  return "";
}

// ===== GET CORRECT LETTER =====
function getCorrectLetter(q) {
  const answer = String(q.answer ?? "").trim();

  if (String(q.optionA ?? "").trim() === answer) return "A";
  if (String(q.optionB ?? "").trim() === answer) return "B";
  if (String(q.optionC ?? "").trim() === answer) return "C";
  if (String(q.optionD ?? "").trim() === answer) return "D";

  return "";
}

// ===== SHOW RESULT COLORS =====
function showAnswerResult(isCorrect, selectedLetter, correctLetter) {
  const selectedBtn = document.getElementById("opt" + selectedLetter);
  const correctBtn = document.getElementById("opt" + correctLetter);

  document.querySelectorAll(".option").forEach(btn => {
    btn.disabled = true;
    btn.classList.remove("selected");
  });

  if (isCorrect) {
    selectedBtn?.classList.add("correct");
    playCorrectSound();
  } else {
    selectedBtn?.classList.add("wrong");
    correctBtn?.classList.add("correct");
    playWrongSound();
  }
}

// ===== FINISH QUIZ =====
function finishQuiz() {
  const endTime = Date.now();
  const duration = endTime - startTime;
  const formattedTime = formatDuration(duration);

  bgm.pause();

  document.getElementById("progress").innerText = "已完成";
  document.getElementById("question").innerHTML =
    `🎉 已完成所有题目<br><br>答对：${correctCount} / ${filteredQuestions.length} 题<br>完成时间：${formattedTime}`;

  document.getElementById("options").style.display = "none";
  document.getElementById("nextBtn").style.display = "none";
}

// ===== NEXT QUESTION =====
async function nextQuestion() {
  if (isLocked) return;

  startBgm();
  playNextSound();

  if (!selectedAnswer) {
    alert("请选择答案");
    return;
  }

  const q = filteredQuestions[currentIndex];

  if (!q) {
    console.log("没有题目了");
    return;
  }

  isLocked = true;

  const userAnswer = getSelectedOptionText(q, selectedAnswer);
  const correctAnswer = String(q.answer ?? "").trim();
  const correctLetter = getCorrectLetter(q);
  const isCorrect = userAnswer === correctAnswer;

  console.log("用户选择字母:", selectedAnswer);
  console.log("用户选项内容:", userAnswer);
  console.log("正确答案:", correctAnswer);
  console.log("正确选项字母:", correctLetter);

  if (isCorrect) {
    correctCount++;
  }

  const record = {
    question_id: q.id,
    year: q.year,
    subject: q.subject,
    question: q.question,

    optionA: q.optionA,
    optionB: q.optionB,
    optionC: q.optionC,
    optionD: q.optionD,

    correct_answer: correctAnswer,
    raw_answer: userAnswer,
    selected_letter: selectedAnswer,
    is_correct: isCorrect,

    timestamp: new Date().toISOString()
  };

  console.log("提交记录:", record);

  try {
    await fetch(SAVE_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(record)
    });
  } catch (err) {
    console.error("保存失败:", err);
  }

  showAnswerResult(isCorrect, selectedAnswer, correctLetter);

  setTimeout(() => {
    currentIndex++;

    if (currentIndex >= filteredQuestions.length) {
      finishQuiz();
      return;
    }

    showQuestion();
  }, 1200);
}

// ===== INIT =====
loadQuestions();
updateMusicButton();

document.getElementById("musicToggle")?.addEventListener("click", () => {
  toggleMusic();
});
