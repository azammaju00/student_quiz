const express = require("express");
const cors = require("cors");
const { google } = require("googleapis");

const app = express();

app.use(cors());
app.use(express.json());

// 前端静态文件


// Google Sheets 配置
const SPREADSHEET_ID_QUESTIONS = "1mX0gf_p_P1ol-KTnQx9boSxj5Zwos2NYQj1Y84EbWEc";
const SPREADSHEET_ID_RECORDS = "1mX0gf_p_P1ol-KTnQx9boSxj5Zwos2NYQj1Y84EbWEc";

// 这里要包含答案列 I
const RANGE_QUESTIONS = "题库!A:I";
const RANGE_RECORDS = "作答记录!A:I";

async function getSheetsClient() {
    const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"]
});
    

  const client = await auth.getClient();

  return google.sheets({
    version: "v4",
    auth: client
  });
}

// 取得题库
app.get("/api/questions", async (req, res) => {
  try {
    const sheets = await getSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID_QUESTIONS,
      range: RANGE_QUESTIONS
    });

    const rows = response.data.values;

    if (!rows || rows.length <= 1) {
      return res.status(404).json({ error: "题库为空" });
    }

    const questions = rows.slice(1).map(r => ({
      id: r[0] || "",
      year: r[1] || "",
      subject: r[2] || "",
      question: r[3] || "",
      optionA: r[4] || "",
      optionB: r[5] || "",
      optionC: r[6] || "",
      optionD: r[7] || "",
      answer: r[8] || ""
    }));

    console.log("返回题库:", questions);

    res.json(questions);
  } catch (err) {
    console.error("无法读取题库", err);
    res.status(500).json({ error: "无法读取题库" });
  }
});

// 存储作答记录
app.post("/api/submit", async (req, res) => {
  try {
    const {
      question_id,
      year,
      subject,
      question,
      optionA,
      optionB,
      optionC,
      optionD,
      correct_answer,
      raw_answer,
      selected_letter,
      is_correct,
      timestamp
    } = req.body;

    const sheets = await getSheetsClient();

    const values = [[
      question_id || "",
      year || "",
      subject || "",
      question || "",
      optionA || "",
      optionB || "",
      optionC || "",
      optionD || "",
      correct_answer || "",
      raw_answer || "",
      selected_letter || "",
      String(is_correct),
      timestamp || ""
    ]];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID_RECORDS,
      range: "作答记录!A:M",
      valueInputOption: "RAW",
      requestBody: { values }
    });

    res.json({ success: true });
  } catch (err) {
    console.error("无法记录作答", err);
    res.status(500).json({ error: "无法记录作答" });
  }
});

app.listen(3000, () => console.log("✅ Server running at http://localhost:3000"));
