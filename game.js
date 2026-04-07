// ===== CONFIG =====
const QUESTIONS_URL = "https://student-quiz-4wu4.onrender.com/api/questions";
const SAVE_API = "https://student-quiz-4wu4.onrender.com/api/submit";
const QUESTIONS_CACHE_KEY = "quizQuestionsCache_v1";

// ===== DOM READY =====
document.addEventListener("DOMContentLoaded", () => {

  // ===== GLOBAL =====
  let questions = [];
  let filteredQuestions = [];
  let currentIndex = 0;
  let selectedAnswer = null;
  let correctCount = 0;
  let startTime = Date.now();
  let isLocked = false;
  let answerHistory = [];

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

  // ===== PARAM =====
  const params = new URLSearchParams(window.location.search);
  const name = params.get("name") || "";
  const school = params.get("school") || "";
  const year = params.get("year") || "";
  const subject = params.get("subject") || "";
  const group = params.get("group") || "";

  console.log("name:", name);
  console.log("school:", school);
  console.log("year:", year);
  console.log("subject:", subject);
  console.log("group:", group);

  // ===== NORMALIZE =====
  function normalizeText(value) {
    return String(value ?? "")
      .trim()
      .replace(/\s+/g, " ");
  }

  // ===== AUDIO =====
  function play(sound) {
    if (!musicEnabled) return;
    sound.currentTime = 0;
    sound.play().catch(() => {});
  }

  function startBgm() {
    if (!musicEnabled || musicStarted) return;
    bgm.play().then(() => {
      musicStarted = true;
    }).catch(() => {});
  }

  function toggleMusic() {
    musicEnabled = !musicEnabled;
    const btn = document.getElementById("musicToggle");

    if (musicEnabled) {
      btn.innerText = "🔊 音乐开";
      btn.classList.remove("off");
      bgm.play().catch(() => {});
    } else {
      btn.innerText = "🔇 音乐关";
      btn.classList.add("off");
      bgm.pause();
    }
  }

  // ===== CACHE =====
  function saveCache(data) {
    try {
      sessionStorage.setItem(QUESTIONS_CACHE_KEY, JSON.stringify(data));
    } catch (err) {
      console.log("缓存失败:", err);
    }
  }

  function getCache() {
    try {
      const c = sessionStorage.getItem(QUESTIONS_CACHE_KEY);
      return c ? JSON.parse(c) : null;
    } catch (err) {
      return null;
    }
  }

  // ===== LOAD =====
  async function loadQuestions() {
    const cached = getCache();

    if (cached && cached.length > 0) {
      questions = cached;
      startTime = Date.now();
      filterQuestions();
      return;
    }

    try {
      const res = await fetch(QUESTIONS_URL);
      const raw = await res.json();

      questions = raw;
      saveCache(raw);
      startTime = Date.now();

      filterQuestions();
    } catch (err) {
      console.error("读取失败", err);
      document.getElementById("question").innerText = "加载失败";
    }
  }

  // ===== FILTER =====
  filteredQuestions = questions.filter(q => {

  if (subject === "作文班") {
    return q.subject === "作文班" && q.group === group;
  }

  return q.year === year && q.subject === subject;
});

    console.log("过滤后的题目:", filteredQuestions);

    if (filteredQuestions.length === 0) {
      document.getElementById("question").innerText = "⚠️ 没有题目";
      document.getElementById("options").style.display = "none";
      document.getElementById("nextBtn").style.display = "none";
      return;
    }

    showQuestion();
 ) }

  // ===== RESET =====
  function resetOptionState() {
    selectedAnswer = null;
    isLocked = false;

    document.querySelectorAll(".option").forEach(btn => {
      btn.classList.remove("selected", "correct", "wrong");
      btn.disabled = false;
    });
  }

  // ===== SHOW =====
  function showQuestion() {
    const q = filteredQuestions[currentIndex];
    if (!q) return;

    resetOptionState();

    document.getElementById("progress").innerText =
      `${currentIndex + 1} / ${filteredQuestions.length}`;

    document.getElementById("question").innerText = q.question;

    document.getElementById("A").innerText = q.optionA ?? "";
    document.getElementById("B").innerText = q.optionB ?? "";
    document.getElementById("C").innerText = q.optionC ?? "";
    document.getElementById("D").innerText = q.optionD ?? "";

    const img = document.getElementById("questionImage");
    if (img) {
      if (q.image) {
        img.src = q.image;
        img.style.display = "block";
      } else {
        img.src = "";
        img.style.display = "none";
      }
    }
  }

  // ===== SELECT =====
  window.selectAnswer = function(letter) {
    if (isLocked) return;

    selectedAnswer = letter;
    startBgm();
    play(clickSound);

    document.querySelectorAll(".option").forEach(btn => {
      btn.classList.remove("selected");
    });

    document.getElementById("opt" + letter)?.classList.add("selected");
  };

  // ===== GET TEXT =====
  function getOptionText(q, letter) {
    if (letter === "A") return q.optionA;
    if (letter === "B") return q.optionB;
    if (letter === "C") return q.optionC;
    if (letter === "D") return q.optionD;
    return "";
  }

  // ===== CORRECT LETTER =====
  function getCorrectLetter(q) {
    const ans = normalizeText(q.answer);

    if (normalizeText(q.optionA) === ans) return "A";
    if (normalizeText(q.optionB) === ans) return "B";
    if (normalizeText(q.optionC) === ans) return "C";
    if (normalizeText(q.optionD) === ans) return "D";

    return "";
  }

  // ===== SHOW RESULT =====
  function showResult(isCorrect, selected, correct) {
    const s = document.getElementById("opt" + selected);
    const c = document.getElementById("opt" + correct);

    document.querySelectorAll(".option").forEach(btn => {
      btn.disabled = true;
      btn.classList.remove("selected");
    });

    if (isCorrect) {
      s?.classList.add("correct");
      play(correctSound);
    } else {
      s?.classList.add("wrong");
      c?.classList.add("correct");
      play(wrongSound);
    }
  }

  // ===== TIME =====
  function formatTime(ms) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return `${m}分${(s % 60).toString().padStart(2, "0")}秒`;
  }

  // ===== SAVE =====
  async function saveSummary() {
    const total = filteredQuestions.length;

    const raw = answerHistory
      .map(a => `${a.no}:${a.answerText || ""}`)
      .join(" | ");

    const payload = {
      submit_time: new Date().toLocaleString(),
      student_name: name,
      year,
      subject,
      group_id: group || "",
      total_questions: total,
      correct_count: correctCount,
      score: "",
      raw_answer: raw
    };

    await fetch(SAVE_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  }

  // ===== FINISH =====
  async function finishQuiz() {
    await saveSummary();

    const time = formatTime(Date.now() - startTime);

    document.getElementById("question").innerHTML =
      `🎉 已完成所有题目<br><br>答对：${correctCount} / ${filteredQuestions.length} 题<br>完成时间：${time}`;

    document.getElementById("options").style.display = "none";
    document.getElementById("nextBtn").style.display = "none";

    const img = document.getElementById("questionImage");
    if (img) {
      img.style.display = "none";
    }

    bgm.pause();
  }

  // ===== NEXT =====
  window.nextQuestion = function() {
    if (isLocked) return;

    startBgm();
    play(nextSound);

    if (!selectedAnswer) {
      alert("请选择答案");
      return;
    }

    const q = filteredQuestions[currentIndex];

    const user = normalizeText(getOptionText(q, selectedAnswer));
    const correct = normalizeText(q.answer);
    const correctLetter = getCorrectLetter(q);

    const isCorrect = user === correct;

    if (isCorrect) correctCount++;

    answerHistory.push({
      no: currentIndex + 1,
      answerText: user
    });

    showResult(isCorrect, selectedAnswer, correctLetter);

    isLocked = true;

    setTimeout(() => {
      currentIndex++;

      if (currentIndex >= filteredQuestions.length) {
        finishQuiz();
        return;
      }

      showQuestion();
    }, 1200);
  };

  // ===== INIT =====
  loadQuestions();

  document.getElementById("musicToggle")
    ?.addEventListener("click", toggleMusic);
});
