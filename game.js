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

    console.log("==== 当前筛选条件 ====", {
      year: currentYear,
      subject: currentSubject,
      group: currentGroup
    });

    filteredQuestions = questions.filter(q => {
      const qYear = normalizeText(q.year);
      const qSubjectRaw = normalizeText(q.subject);
      const qSubject = normalizeSubject(q.subject);
      const qGroup = normalizeText(q.group);

      // ✨ 作文班
      if (currentSubject === "作文班") {
        return qSubjectRaw === "作文班" && qGroup === currentGroup;
      }

      // ✨ 学校题
      return (
        qYear === currentYear &&
        qSubject === normalizeSubject(currentSubject)
      );
    });

    console.log("==== 过滤后的题目 ====", filteredQuestions);

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
  }

  // ===== SELECT =====
  window.selectAnswer = function(letter) {
    if (isLocked) return;

    selectedAnswer = letter;

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

  // ===== 找正确答案字母 =====
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
    } else {
      s?.classList.add("wrong");
      c?.classList.add("correct");
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
  }

  // ===== NEXT =====
  window.nextQuestion = function() {
    if (isLocked) return;

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
    }, 1000);
  };

  // ===== INIT =====
  loadQuestions();

});
