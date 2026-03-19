let selectedYear = "";
let selectedSubject = "";

/* ===== 年级按钮 ===== */
document.querySelectorAll(".year-buttons button").forEach(btn => {
  btn.addEventListener("click", () => {
    // 清除同组 active
    document
      .querySelectorAll(".year-buttons button")
      .forEach(b => b.classList.remove("active"));

    // 设为选中
    btn.classList.add("active");
    selectedYear = btn.dataset.year;
  });
});

/* ===== 科目按钮 ===== */
document.querySelectorAll(".subject-buttons button").forEach(btn => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".subject-buttons button")
      .forEach(b => b.classList.remove("active"));

    btn.classList.add("active");
    selectedSubject = btn.dataset.subject;
  });
});

/* ===== 开始按钮 ===== */
document.getElementById("startBtn").addEventListener("click", () => {
  const name = document.getElementById("studentName").value.trim();
  const school = document.getElementById("schoolName").value.trim();

  if (!name || !school || !|| !selectedSubject) {
    alert("请填写学生资料并选择年级和科目");
    return;
  }

  // 跳转到 game.html
  location.href =
    `game.html?name=${encodeURIComponent(name)}` +
    `&school=${encodeURIComponent(school)}` +
    `&year=${encodeURIComponent(selectedYear)}` +
    `&subject=${encodeURIComponent(selectedSubject)}`;
});
