const User = require("./../models/userModel");
const Course = require("./../models/courseSchema");
const Chapter = require("./../models/chapterSchema");
const Lecture = require("./../models/lectureSchema");
const catchAsync = require("./../utils/catchAsync");
const appError = require("./../utils/appClass");
const Enrollment = require("./../models/enrollSchema");

const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

exports.generateNotes = catchAsync(async (req, res, next) => {
  const { lectureId } = req.params;

  const lecture = await Lecture.findById(lectureId);

  if (!lecture) {
    return next(new appError("There is no lecture with this id", 400));
  }

  const chapter = await Chapter.findById(lecture.chapter);

  const courseId = chapter.course;

  const enrolled = await Enrollment.findOne({
    user: req.user._id,
    course: courseId,
  });

  if (!enrolled) {
    return next(
      new appError(
        "You are not authorized to view the AI notes of this lecture",
        401,
      ),
    );
  }

  if (!lecture.description) {
    return next(
      new appError(
        "Add description to generate the AI notes for this lecture",
        400,
      ),
    );
  }

  const prompt = `
You are an expert teacher.

Based on the lecture description below, generate structured study notes.

Lecture:
"${lecture.description}"

IMPORTANT:
- Return ONLY valid JSON
- Do NOT add markdown, text, or explanation outside JSON
- Follow the exact structure

FORMAT:

{
  "keyPoints": ["", "", ""],
  "summary": "",
  "explanation": "",
  "importantTerms": [
    {
      "term": "",
      "definition": ""
    }
  ]
}
`;
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: prompt,
  });

  let text = response.text;

  // Clean markdown if present
  if (text) {
    text = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
  }

  // 🔥 Extract only JSON safely
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");

  if (start === -1 || end === -1) {
    return next(new appError("Invalid AI response format", 500));
  }

  const jsonString = text.substring(start, end + 1);

  let parsed;

  try {
    parsed = JSON.parse(jsonString);
  } catch (err) {
    console.error("AI JSON parse failed:", text);
    return next(new appError("Failed to parse AI response", 500));
  }

  // ✅ Save to DB
  lecture.aiNotes = parsed;
  await lecture.save();
  return res.status(200).json({
    status: "success",
    data: {
      aiNotes: parsed,
    },
  });
});
exports.generateQuiz = catchAsync(async (req, res, next) => {
  const { lectureId } = req.params;

  const lecture = await Lecture.findById(lectureId);

  if (!lecture) {
    return next(new appError("Lecture not found", 404));
  }

  // ✅ Avoid regenerating
  if (lecture.quiz && lecture.quiz.length > 0) {
    return res.status(200).json({
      status: "success",
      data: { quiz: lecture.quiz },
    });
  }

  const chapter = await Chapter.findById(lecture.chapter);

  const courseId = chapter.course;

  const enrolled = await Enrollment.findOne({
    user: req.user._id,
    course: courseId,
  });

  if (!enrolled) {
    return next(
      new appError(
        "You are not authorized to view the AI notes of this lecture",
        401,
      ),
    );
  }

  if (!lecture.description) {
    return next(new appError("Lecture description required", 400));
  }

  const prompt = `
Based on this lecture:

"${lecture.description}"

Generate 5 multiple choice questions.

Return ONLY JSON array in this format:
[
  {
    "question": "string",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": "one of the options"
  }
]

Rules:
- Exactly 5 questions
- 4 options each
- No explanation
- No markdown
- No extra text
`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: prompt,
  });

  let text = response.text;

  text = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");

  if (start === -1 || end === -1) {
    return next(new appError("Invalid AI response format", 500));
  }

  const jsonString = text.substring(start, end + 1);

  let quiz;

  try {
    quiz = JSON.parse(jsonString);
  } catch (err) {
    console.error("Quiz parse failed:", jsonString);
    return next(new appError("Failed to parse quiz", 500));
  }

  // ✅ Save
  lecture.quiz = quiz;
  await lecture.save();

  res.status(200).json({
    status: "success",
    data: { quiz },
  });
});

exports.doubtSolver = catchAsync(async (req, res, next) => {
  const { lectureId } = req.params;
  const { doubt } = req.body;

  if (!doubt) {
    return next(
      new appError("Please post your doubt to get the required answer", 400),
    );
  }

  const lecture = await Lecture.findById(lectureId);

  if (!lecture) {
    return next(new appError("There is no lecture with that id", 400));
  }

  const chapter = await Chapter.findById(lecture.chapter);
  const courseId = chapter.course;

  const enrollment = await Enrollment.findOne({
    user: req.user._id,
    course: courseId,
  });

  if (!enrollment) {
    return next(
      new appError(
        "You are not authorized to get the doubt solver help of this lecture",
        401,
      ),
    );
  }

  if (!lecture.description) {
    return next(new appError("There is no description for this lecture", 400));
  }

  if (
    lecture.lastDoubt &&
    lecture.lastAnswer &&
    lecture.lastDoubt.toLowerCase().trim() === doubt.toLowerCase().trim()
  ) {
    return res.status(200).json({
      status: "success",
      data: {
        answer: lecture.lastAnswer,
        cached: true,
      },
    });
  }

  const prompt = `
You are an expert teacher who explains concepts clearly to beginners.

Your job is to answer student doubts using:
1. Lecture context
2. Previous conversation (chat history)

IMPORTANT:
- You MUST use previous conversation when relevant
- If the student uses words like "it", "this", "that", "previous", etc.,
  infer meaning from the chat history
- Maintain a natural conversational tone when needed

Lecture Context:
"${lecture.description}"

Rules:
1. If the question is related to the lecture OR previous conversation:
   - Answer it clearly

2. If the question is completely unrelated to BOTH lecture AND chat history:
   - Return:
   {
     "answer": "This question is not related to this lecture. Please ask questions relevant to the topic."
   }

3. Answer Guidelines:
   - Use beginner-friendly language
   - Keep answer concise (5–8 lines max)
   - Use examples if helpful
   - If it's a follow-up, you may refer to previous question naturally

4. IMPORTANT:
   - Return ONLY valid JSON
   - Do NOT include markdown, backticks, or extra text
   - Output must be strictly in this format:

{
  "answer": "your answer here"
}

If you fail to follow JSON format, return:
{ "answer": "Sorry, I could not process this question." }
`;

  const history = (lecture.chatHistory || []).slice(-5).map((msg) => ({
    role: msg.role === "ai" ? "model" : "user",
    parts: [{ text: msg.message }],
  }));

  const contents = [
    {
      role: "model",
      parts: [{ text: prompt }],
    },
    ...history,
    {
      role: "user",
      parts: [{ text: doubt }],
    },
  ];

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents,
  });

  let text = response.text;

  if (!text) {
    return next(new appError("Empty AI response", 500));
  }

  text = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  let parsed;

  try {
    parsed = JSON.parse(text);
  } catch (err) {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");

    if (start === -1 || end === -1) {
      console.error("RAW AI RESPONSE:", text);
      return next(new appError("Invalid AI response format", 500));
    }

    const jsonString = text.substring(start, end + 1);

    try {
      parsed = JSON.parse(jsonString);
    } catch (e) {
      console.error("JSON EXTRACT FAILED:", jsonString);
      return next(new appError("Failed to parse answer", 500));
    }
  }

  if (!parsed.answer) {
    console.error("INVALID STRUCTURE:", parsed);
    return next(new appError("Invalid AI response structure", 500));
  }

  lecture.lastDoubt = doubt;
  lecture.lastAnswer = parsed.answer;

  lecture.chatHistory = lecture.chatHistory || [];

  lecture.chatHistory.push(
    { role: "user", message: doubt },
    { role: "ai", message: parsed.answer },
  );

  lecture.chatHistory = lecture.chatHistory.slice(-10);

  await lecture.save();

  return res.status(200).json({
    status: "success",
    data: {
      answer: parsed.answer,
      cached: false,
    },
  });
});
