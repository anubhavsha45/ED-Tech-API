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

  const prompt = `
   You are an expert teacher who explains concepts clearly to beginners.

Your job is to answer student doubts based ONLY on the lecture context.

Lecture Context:
"${lecture.description}"

Student Question:
"${doubt}"

Rules:
1. If the question is NOT related to the lecture context:
   - Return:
   {
     "answer": "This question is not related to this lecture. Please ask questions relevant to the topic."
   }

2. If the question IS relevant:
   - Give a clear and simple explanation
   - Use beginner-friendly language
   - Keep answer concise (5–8 lines max)
   - Use examples if helpful

3. IMPORTANT:
   - Return ONLY valid JSON
   - Do NOT include markdown, backticks, or extra text
   - Output must be strictly in this format:

{
  "answer": "your answer here"
}
`;
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: prompt,
  });

  let text = response.text;

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");

  if (start === -1 || end === -1) {
    return next(new appError("Invalid AI response format", 500));
  }

  const jsonString = text.substring(start, end + 1);

  let answer;

  try {
    answer = JSON.parse(jsonString);
  } catch (err) {
    console.error("Answer parse failed:", jsonString);
    return next(new appError("Failed to parse answer", 500));
  }

  return res.status(200).json({
    status: "success",
    data: {
      answer,
    },
  });
});
