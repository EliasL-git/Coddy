const express = require("express");
const OpenAI = require("openai");
const auth = require("../middleware/auth");
const { loadLessons } = require("../services/courseLoader");
const Submission = require("../models/Submission");
const User = require("../models/User");

const router = express.Router();

// ─── Lazy-init (supports any OpenAI-compatible provider via env) ──────────────

let _client = null;
function getClient() {
  if (!_client && process.env.OPENAI_API_KEY) {
    _client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
    });
  }
  return _client;
}

// ─── Prompt ───────────────────────────────────────────────────────────────────

function buildPrompt(code, challenge, language) {
  const requirements = challenge.checks?.length
    ? `\nKey requirements: ${challenge.checks.join(", ")}`
    : "";

  return `## Task
Title: ${challenge.title}
Instructions: ${challenge.instructions}${requirements}

## Student's ${language} code
\`\`\`${language}
${code}
\`\`\`

## Is this valid?
Respond with JSON only — no markdown, no extra text:
- If the code correctly completes the task: {"valid": true, "fix": null}
- If it does not: {"valid": false, "fix": "One or two sentences telling the student exactly what to change and why."}`;
}

// ─── Local fallback (used when no API key or on network error) ────────────────

function localCheck(code, challenge) {
  const norm = code
    .toLowerCase()
    .replace(/['"]/g, '"')
    .replace(/\s+/g, " ")
    .trim();

  if (!norm) {
    return {
      valid: false,
      fix: "Add your code above, then press Check Answer.",
      aiPowered: false,
    };
  }

  const checks = challenge.checks || [];
  if (checks.length) {
    const missing = checks.filter(
      (c) =>
        !norm.includes(
          c.toLowerCase().replace(/['"]/g, '"').replace(/\s+/g, " ").trim(),
        ),
    );
    if (missing.length) {
      return {
        valid: false,
        fix: `Your code is missing: ${missing.map((m) => `\`${m}\``).join(", ")}. Re-read the instructions and add the missing piece.`,
        aiPowered: false,
      };
    }
  }

  return { valid: true, fix: null, aiPowered: false };
}

// ─── Route ────────────────────────────────────────────────────────────────────

// POST /api/check   body: { lessonId, challengeId, code }
// Response:         { valid: bool, fix: string|null, aiPowered: bool }
router.post("/", auth, async (req, res) => {
  const { lessonId, challengeId, code = "" } = req.body;

  if (!lessonId || !challengeId) {
    return res
      .status(400)
      .json({ message: "lessonId and challengeId are required" });
  }

  const lessons = loadLessons();
  const lesson = lessons.find((l) => l.id === lessonId);
  if (!lesson) return res.status(404).json({ message: "Lesson not found" });

  const challenge = (lesson.challenges || []).find((c) => c.id === challengeId);
  if (!challenge)
    return res.status(404).json({ message: "Challenge not found" });

  if (!code.trim()) {
    return res.json({
      valid: false,
      fix: "Add your code above, then press Check Answer.",
      aiPowered: false,
    });
  }

  const client = getClient();
  if (!client) {
    const checkResult = localCheck(code, challenge);

    // Save local submission as well
    try {
      await Submission.create({
        userId: req.user.id,
        lessonId,
        challengeId,
        language: lesson.language,
        code,
        isValid: checkResult.valid,
        feedback: checkResult.fix,
        aiPowered: false,
      });

      // Update user's site code if valid
      let updatedUser = null;
      if (checkResult.valid) {
        updatedUser = await User.findByIdAndUpdate(
          req.user.id,
          { [`siteCode.${lesson.language}`]: code },
          { new: true },
        ).select("-password");
      }
    } catch (saveErr) {
      console.error("[Submission Save Error - Local]", saveErr.message);
    }

    return res.json({ ...checkResult, user: updatedUser });
  }

  try {
    const completion = await client.chat.completions.create({
      model: process.env.AI_MODEL || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a coding tutor for beginners. " +
            'Given a task and student code, answer "Is this valid?" with JSON only: ' +
            '{"valid": boolean, "fix": string | null}. ' +
            "If invalid, fix must be 1–2 sentences telling the student exactly what to change.",
        },
        {
          role: "user",
          content: buildPrompt(code, challenge, lesson.language),
        },
      ],
      temperature: 0.2,
      max_tokens: 120,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content?.trim() || "{}";
    let result;
    try {
      result = JSON.parse(raw);
    } catch {
      return res.json(localCheck(code, challenge));
    }

    const finalResult = {
      valid: Boolean(result.valid),
      fix: result.valid
        ? null
        : result.fix || "Review the instructions and try again.",
      aiPowered: true,
    };

    // Save submission for future training
    try {
      await Submission.create({
        userId: req.user.id,
        lessonId,
        challengeId,
        language: lesson.language,
        code,
        isValid: finalResult.valid,
        feedback: finalResult.fix,
        aiPowered: true,
      });

      // Update user's site code if valid
      let updatedUser = null;
      if (finalResult.valid) {
        updatedUser = await User.findByIdAndUpdate(
          req.user.id,
          { [`siteCode.${lesson.language}`]: code },
          { new: true },
        ).select("-password");
      }
    } catch (saveErr) {
      console.error("[Submission Save Error]", saveErr.message);
    }

    return res.json({ ...finalResult, user: updatedUser });
  } catch (err) {
    console.error("[AI check]", err.message);
    return res.json(localCheck(code, challenge));
  }
});

module.exports = router;
