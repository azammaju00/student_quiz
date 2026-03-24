// ===== CONFIG =====
const QUESTIONS_URL = "https://student-quiz-4wu4.onrender.com/api/questions"
const SAVE_API = "https://student-quiz-4wu4.onrender.com/api/submit";
const QUESTIONS_CACHE_KEY = "quizQuestionsCache_v1";

// ===== 等 DOM 载入后再执行 =====
document.addEventListener("DOMContentLoaded", () => {
  // ===== GLOBAL =====
  let questions = [];
  let filteredQuestions = [];
  let currentIndex = 0;
  let selectedAnswer = null;
  let correctCount = 0;
  let startTime = Date.now();
  let isLocked = false;

  // 整份作答记录
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

  // ===== GET PARAM =====
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

  // ===== AUDIO FUNCTIONS =====
  function playClickSound() {
    if (!musicEnabled) return;
    clickSound.currentTime = 0;
    clickSound.play().catch(() => {});
  }

  function playNextSound() {
    if (!musicEnabled) return;
    nextSound.currentTime = 0;
    nextSound.play().catch(() => {});
  }

  function playCorrectSound() {
    if (!musicEnabled) return;
    correctSound.currentTime = 0;
    correctSound.play().catch(() => {});
  }

  function playWrongSound() {
    if (!musicEnabled) return;
    wrongSound.currentTime = 0;
    wrongSound.play().catch(() => {});
  }

  function startBgm() {
    if (!musicEnabled || musicStarted) return;

    bgm.play()
      .then(() => {
        musicStarted = true;
      })
      .catch(() => {});
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
        .catch(() => {});
    } else {
      bgm.pause();
      updateMusicButton();
    }
  }

  // ===== LOADING TEXT =====
  function setLoadingText(text) {
    const questionEl = document.getElementById("question");
    if (questionEl) {
      questionEl.innerText = text;
    }
  }

  // ===== CACHE HELPERS =====
  function saveQuestionsToCache(data) {
    try {
      sessionStorage.setItem(QUESTIONS_CACHE_KEY, JSON.stringify(data));
    } catch (err) {
      console.log("缓存题库失败:", err);
    }
  }

  function getQuestionsFromCache() {
    try {
      const cached = sessionStorage.getItem(QUESTIONS_CACHE_KEY);
      if (!cached) return null;
      return JSON.parse(cached);
    } catch (err) {
      console.log("读取缓存失败:", err);
      return null;
    }
  }

  // ===== LOAD QUESTIONS =====
  async function loadQuestions() {
    setLoadingText("题目加载中，请稍候...");

    const loadingTimer = setTimeout(() => {
      setLoadingText("服务器启动中，请稍候...");
    }, 3000);

    try {
      const cachedQuestions = getQuestionsFromCache();

      if (cachedQuestions && Array.isArray(cachedQuestions) && cachedQuestions.length > 0) {
        questions = cachedQuestions;
        clearTimeout(loadingTimer);
        startTime = Date.now();
        filterQuestions();
        return;
      }

      const res = await fetch(QUESTIONS_URL);
      const raw = await res.json();

      questions = raw;
      saveQuestionsToCache(raw);

      clearTimeout(loadingTimer);
      startTime = Date.now();

      filterQuestions();
    } catch (err) {
      clearTimeout(loadingTimer);
      console.error("读取题库失败", err);
      setLoadingText("读取题目失败，请刷新重试");
    }
  }

  // ===== FILTER =====
  function filterQuestions() {
    filteredQuestions = questions.filter(q => {
      return q.year === year && q.subject === subject;
    });

    console.log("过滤后的题目:", filteredQuestions);

    if (filteredQuestions.length === 0) {
      setLoadingText("⚠️ 没有符合条件的题目");

      const optionsEl = document.getElementById("options");
      const nextBtn = document.getElementById("nextBtn");

      if (optionsEl) optionsEl.style.display = "none";
      if (nextBtn) nextBtn.style.display = "none";
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

    const progressEl = document.getElementById("progress");
    const questionEl = document.getElementById("question");

    if (progressEl) {
      progressEl.innerText = `${currentIndex + 1} / ${filteredQuestions.length}`;
    }

    if (questionEl) {
      questionEl.innerText = q.question;
    }

    const a = document.getElementById("A");
    const b = document.getElementById("B");
    const c = document.getElementById("C");
    const d = document.getElementById("D");

    if (a) a.innerText = q.optionA ?? "";
    if (b) b.innerText = q.optionB ?? "";
    if (c) c.innerText = q.optionC ?? "";
    if (d) d.innerText = q.optionD ?? "";
  }

  // ===== SELECT ANSWER =====
  window.selectAnswer = function(letter) {
    if (isLocked) return;

    selectedAnswer = letter;

    startBgm();
    playClickSound();

    document.querySelectorAll(".option").forEach(btn => {
      btn.classList.remove("selected");
    });

    const btn = document.getElementById("opt" + letter);
    if (btn) {
      btn.classList.add("selected");
    }
  };

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
      if (selectedBtn) selectedBtn.classList.add("correct");
      playCorrectSound();
    } else {
      if (selectedBtn) selectedBtn.classList.add("wrong");
      if (correctBtn) correctBtn.classList.add("correct");
      playWrongSound();
    }
  }

  // ===== SAVE SUMMARY =====
  async function saveQuizSummary() {
    const totalQuestions = filteredQuestions.length;
    const score = totalQuestions > 0
      ? Math.round((correctCount / totalQuestions) * 100)
      : 0;

    const rawAnswerText = answerHistory
      .map(item => `${item.no}:${item.answerText}`)
      .join(" | ");

    const payload = {
      submit_time: new Date().toLocaleString("zh-CN", { hour12: false }),
      student_name: name,
      year: year,
      subject: subject,
      group_id: group || "",
      total_questions: totalQuestions,
      correct_count: correctCount,
      score: score,
      raw_answer: rawAnswerText
    };

    console.log("提交 summary:", payload);

    try {
      await fetch(SAVE_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.error("保存 summary 失败:", err);
    }
  }

  // ===== FINISH QUIZ =====
  async function finishQuiz() {
    const endTime = Date.now();
    const duration = endTime - startTime;
    const formattedTime = formatDuration(duration);

    const totalQuestions = filteredQuestions.length;
    const score = totalQuestions > 0
      ? Math.round((correctCount / totalQuestions) * 100)
      : 0;

    await saveQuizSummary();

    bgm.pause();

    const progressEl = document.getElementById("progress");
    const questionEl = document.getElementById("question");
    const optionsEl = document.getElementById("options");
    const nextBtn = document.getElementById("nextBtn");

    if (progressEl) {
      progressEl.innerText = "已完成";
    }

    if (questionEl) {
      questionEl.innerHTML =
        `🎉 已完成所有题目<br><br>答对：${correctCount} / ${totalQuestions} 题<br>成绩：${score} 分<br>完成时间：${formattedTime}`;
    }

    if (optionsEl) optionsEl.style.display = "none";
    if (nextBtn) nextBtn.style.display = "none";
  }

  // ===== NEXT QUESTION =====
  window.nextQuestion = async function() {
    if (isLocked) return;

    startBgm();
    playNextSound();

    if (!selectedAnswer) {
      alert("请选择答案");
      return;
    }

    const q = filteredQuestions[currentIndex];
    if (!q) return;

    isLocked = true;

    const userAnswer = getSelectedOptionText(q, selectedAnswer);
    const correctAnswer = String(q.answer ?? "").trim();
    const correctLetter = getCorrectLetter(q);
    const isCorrect = userAnswer === correctAnswer;

    if (isCorrect) {
      correctCount++;
    }

    answerHistory.push({
      no: currentIndex + 1,
      selectedLetter: selectedAnswer,
      answerText: userAnswer,
      isCorrect: isCorrect
    });

    showAnswerResult(isCorrect, selectedAnswer, correctLetter);

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
  updateMusicButton();

  document.getElementById("musicToggle")?.addEventListener("click", () => {
    toggleMusic();
  });
});
