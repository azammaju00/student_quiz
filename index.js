let mode = "";
let selectedYear = "";
let selectedSubject = "";
let selectedGroup = "";

/* ===== 模式选择 ===== */
document.querySelectorAll(".mode-buttons button").forEach(btn => {
  btn.addEventListener("click", () => {

    document.querySelectorAll(".mode-buttons button")
      .forEach(b => b.classList.remove("active"));

    btn.classList.add("active");
    mode = btn.dataset.mode;

    document.getElementById("schoolSection").style.display =
      mode === "school" ? "block" : "none";

    document.getElementById("compositionSection").style.display =
      mode === "composition" ? "block" : "none";
  });
});

/* ===== 年级 ===== */
document.querySelectorAll(".year-buttons button").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".year-buttons button")
      .forEach(b => b.classList.remove("active"));

    btn.classList.add("active");
    selectedYear = btn.dataset.year;
  });
});

/* ===== 科目 ===== */
document.querySelectorAll(".subject-buttons button").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".subject-buttons button")
      .forEach(b => b.classList.remove("active"));

    btn.classList.add("active");
    selectedSubject = btn.dataset.subject;
  });
});

/* ===== 作文班 ===== */
document.querySelectorAll(".group-buttons button").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".group-buttons button")
      .forEach(b => b.classList.remove("active"));

    btn.classList.add("active");
    selectedGroup = btn.dataset.group;
  });
});

/* ===== 开始 ===== */
document.getElementById("startBtn").addEventListener("click", () => {

  const name = document.getElementById("studentName").value.trim();
  const school = document.getElementById("schoolName").value.trim();

  if (!name || !school || !mode) {
    alert("请填写资料并选择模式");
    return;
  }

  let url = `game.html?name=${encodeURIComponent(name)}&school=${encodeURIComponent(school)}`;

  if (mode === "school") {
    if (!selectedYear || !selectedSubject) {
      alert("请选择年级和科目");
      return;
    }

    url += `&year=${selectedYear}&subject=${selectedSubject}`;
  }

  if (mode === "composition") {
    if (!selectedGroup) {
      alert("请选择练习");
      return;
    }

    url += `&year=基础作文班&group=${selectedGroup}`;
  }

  location.href = url;
});
