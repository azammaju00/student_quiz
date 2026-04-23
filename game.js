// ===== CONFIG =====
const QUESTIONS_URL = "https://student-quiz-4wu4.onrender.com/api/questions";
const SAVE_API = "https://student-quiz-4wu4.onrender.com/api/submit";

// ===== DOM READY =====
document.addEventListener("DOMContentLoaded", () => {
  let questions = [];
  let filteredQuestions = [];
  let currentIndex = 0;
  let selectedAnswer = null;
  let correctCount = 0;
  let startTime = Date.now();
  let isLocked = false;
  let answerHistory = [];

  // ===== 音乐 =====
  let musicEnabled = true;
  let musicStarted = false;
  let currentVolume = 0.35;
  let lastVolume = 0.35;

  const clickSound = new Audio("./audio/optionSound.wav");
  const nextSound = new Audio("./audio/nextQuestionSound.wav");
  const correctSound = new Audio("./audio/correctSound.mp3");
  const wrongSound = new Audio("./audio/wrongSound.mp3");
  const bgm = new Audio("./audio/backgroundMusic.mp3");

  bgm.loop = true;

  // ===== PARAM =====
  const params = new URLSearchParams(window.location.search);
  const name = params.get("name") || "";
  const school = params.get("school") || "";
  const year = params.get("year") || "";
  const subject = params.get("subject") || "";
  const group = params.get("group") || "";

  console.log("year:", year);
  console.log("subject:", subject);
  console.log("group:", group);

  // ===== NORMALIZE =====
  function normalizeText(v) {
    return String(v ?? "").trim().replace(/\s+/g, " ");
  }

  function normalizeSubject(v) {
    const t = normalizeText(v).toUpperCase();

    if (t === "MATEMATIK" || t === "数学") return "MATH";
    if (t === "SAINS" || t === "科学") return "SN";
    if (t === "BAHASA MELAYU" || t === "国文") return "BM";
    if (t === "BAHASA INGGERIS" || t === "英文") return "BI";
    if (t === "BAHASA CINA" || t === "华文") return "BC";

    return t;
  }

  // ===== 音量 =====
  function applyVolume() {
    clickSound.volume = currentVolume;
    nextSound.volume = currentVolume;
    correctSound.volume = currentVolume;
    wrongSound.volume = currentVolume;
    bgm.volume = currentVolume * 0.35;
  }

  function updateAudioUI() {
    const btn = document.getElementById("musicToggle");
    const slider = document.getElementById("volumeSlider");

    if (slider) slider.value = Math.round(currentVolume * 100);

    if (btn) {
      btn.textContent = currentVolume === 0 ? "🔇" : "🔊";
    }
  }

  function play(sound) {
    if (!musicEnabled || currentVolume === 0) return;
    sound.currentTime = 0;
    sound.play().catch(() => {});
  }

  function startBgm() {
    if (!musicEnabled || musicStarted || currentVolume === 0) return;
    bgm.play().then(() => {
      musicStarted = true;
    }).catch(() => {});
  }

  function toggleMusic() {
    if (currentVolume === 0) {
      currentVolume = lastVolume > 0 ? lastVolume : 0.35;
      musicEnabled = true;
      applyVolume();
      updateAudioUI();
      bgm.play().catch(() => {});
    } else {
      lastVolume = currentVolume;
      currentVolume = 0;
      musicEnabled = false;
      applyVolume();
      updateAudioUI();
      bgm.pause();
    }
  }

  function handleSlider(e) {
    const val = Number(e.target.value) / 100;
    currentVolume = val;

    if (val === 0) {
      musicEnabled = false;
      bgm.pause();
    } else {
      lastVolume = val;
      musicEnabled = true;
      bgm.play().catch(() => {});
    }

    applyVolume();
    updateAudioUI();
  }

  applyVolume();

  // ===== 评分星星 =====
  function getStarCount(correct, total) {
    if (total === 0) return 0;
    const rate = correct / total;
    if (rate >= 0.8) return 3;
    if (rate >= 0.5) return 2;
    return 1;
  }

  function showStars(correct, total) {
    const box = document.getElementById("resultBox");
    const container = document.getElementById("starsContainer");
    if (!box || !container) return;

    container.innerHTML = "";

    const count = getStarCount(correct, total);

    for (let i = 0; i < count; i++) {
      const star = document.createElement("div");
      star.className = "star";

      if (i === 0) star.classList.add("offset-down");
      if (i === 1) star.classList.add("offset-up");
      if (i === 2) star.classList.add("offset-down");

      star.textContent = "★";
      container.appendChild(star);

      setTimeout(() => {
        star.classList.add("show");
      }, i * 220);
    }
  }

  // ===== LOAD =====
  async function loadQuestions() {
    try {
      const res = await fetch(QUESTIONS_URL, { cache: "no-store" });
      const raw = await res.json();

      questions = raw;
      startTime = Date.now();

      filterQuestions();
    } catch (err) {
      console.error("读取失败", err);
      document.getElementById("question").innerText = "加载失败";
    }
  }

  // ===== FILTER =====
  function filterQuestions() {
    const currentYear = normalizeText(year);
    const currentSubject = normalizeText(subject);
    const currentGroup = normalizeText(group);

    filteredQuestions = questions.filter(q => {
      const qYear = normalizeText(q.year);
      const qSubjectRaw = normalizeText(q.subject);
      const qSubject = normalizeSubject(q.subject);
      const qGroup = normalizeText(q.group);

      if (currentSubject === "作文班") {
        return qSubjectRaw === "作文班" && qGroup === currentGroup;
      }

      return (
        qYear === currentYear &&
        qSubject === normalizeSubject(currentSubject)
      );
    });

    if (filteredQuestions.length === 0) {
      document.getElementById("question").innerText = "⚠️ 没有题目";
      document.getElementById("options").style.display = "none";
      document.getElementById("nextBtn").style.display = "none";
      return;
    }

    showQuestion();
  }

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

  // ===== 找正确答案 =====
  function getCorrectLetter(q) {
    const ans = normalizeText(q.answer);

    if (normalizeText(q.optionA) === ans) return "A";
    if (normalizeText(q.optionB) === ans) return "B";
    if (normalizeText(q.optionC) === ans) return "C";
    if (normalizeText(q.optionD) === ans) return "D";

    return "";
  }

  // ===== 显示结果 =====
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
    const raw = answerHistory
      .map(a => `${a.no}:${a.answerText || ""}`)
      .join(" | ");

    const payload = {
      submit_time: new Date().toLocaleString(),
      student_name: name,
      year,
      subject,
      group_id: group || "",
      total_questions: filteredQuestions.length,
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

    const total = filteredQuestions.length;
    const time = formatTime(Date.now() - startTime);

    document.getElementById("question").style.display = "none";
    document.getElementById("options").style.display = "none";
    document.getElementById("nextBtn").style.display = "none";

    const img = document.getElementById("questionImage");
    if (img) img.style.display = "none";

    document.getElementById("resultBox").style.display = "block";
    showStars(correctCount, total);

    document.getElementById("finalText").innerHTML =
      `答对：${correctCount} / ${total} 题<br>完成时间：${time}`;

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

  document.getElementById("volumeSlider")
    ?.addEventListener("input", handleSlider);

  document.getElementById("retryBtn")
    ?.addEventListener("click", () => {
      location.reload();
    });

  document.getElementById("homeBtn")
    ?.addEventListener("click", () => {
      window.location.href = "index.html";
    });

  updateAudioUI();
});
