require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, "../frontend")));

// ─── IBM IAM Token Cache ──────────────────────────────────────────────────────
let cachedToken = null;
let tokenExpiry = 0;

async function getIBMToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const params = new URLSearchParams();
  params.append("grant_type", "urn:ibm:params:oauth:grant-type:apikey");
  params.append("apikey", process.env.IBM_API_KEY);

  const res = await axios.post(
    "https://iam.cloud.ibm.com/identity/token",
    params,
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );

  cachedToken = res.data.access_token;
  // expire 5 minutes before actual expiry
  tokenExpiry = Date.now() + (res.data.expires_in - 300) * 1000;
  return cachedToken;
}

// ─── Helper: Call IBM Granite ─────────────────────────────────────────────────
async function callGranite(prompt) {
  const token = await getIBMToken();

  const payload = {
    model_id: process.env.IBM_MODEL_ID,
    project_id: process.env.IBM_PROJECT_ID,
    input: prompt,
    parameters: {
      decoding_method: "greedy",
      max_new_tokens: 800,
      min_new_tokens: 50,
      stop_sequences: [],
      repetition_penalty: 1.1,
    },
  };

  const res = await axios.post(process.env.IBM_ML_URL, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  return res.data.results?.[0]?.generated_text?.trim() || "No response generated.";
}

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * POST /api/generate-question
 * Generate an interview question based on role, topic, difficulty
 */
app.post("/api/generate-question", async (req, res) => {
  try {
    const { role, topic, difficulty, language } = req.body;

    const prompt = `You are an expert interview coach helping students and job seekers across India prepare for interviews.

Generate a single, clear ${difficulty || "medium"} difficulty interview question for a ${role || "Software Engineer"} position focused on the topic: "${topic || "General"}".
${language && language !== "English" ? `Write the question in ${language} (but keep technical terms in English).` : ""}

Provide:
1. The interview question
2. Key points the candidate should cover in their answer
3. A sample strong answer (3-5 sentences)

Format your response clearly with sections labeled: QUESTION, KEY POINTS, SAMPLE ANSWER.`;

    const result = await callGranite(prompt);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error("generate-question error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/evaluate-answer
 * Evaluate a candidate's answer to an interview question
 */
app.post("/api/evaluate-answer", async (req, res) => {
  try {
    const { question, answer, role } = req.body;

    const prompt = `You are an expert interview coach helping students and job seekers across India prepare for job interviews.

Interview Question: "${question}"
Candidate's Answer: "${answer}"
Target Role: ${role || "Software Engineer"}

Please evaluate this answer and provide:
1. SCORE: Rate the answer out of 10
2. STRENGTHS: What the candidate did well (2-3 points)
3. IMPROVEMENTS: Areas to improve (2-3 points)
4. BETTER ANSWER: A revised, stronger version of the answer
5. TIP: One practical interview tip for Indian job market context

Be encouraging, constructive, and specific.`;

    const result = await callGranite(prompt);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error("evaluate-answer error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/mock-interview
 * Start or continue a mock interview session
 */
app.post("/api/mock-interview", async (req, res) => {
  try {
    const { role, history, userMessage } = req.body;

    let conversationContext = "";
    if (history && history.length > 0) {
      conversationContext = history
        .map((h) => `${h.role === "user" ? "Candidate" : "Interviewer"}: ${h.content}`)
        .join("\n");
    }

    const prompt = `You are a professional interviewer conducting a job interview for the role of ${role || "Software Engineer"} at a top Indian company.

${conversationContext ? `Interview conversation so far:\n${conversationContext}\n` : "This is the start of the interview."}

Candidate just said: "${userMessage}"

Respond as the interviewer. Keep responses concise (2-4 sentences). Ask a follow-up question or move to the next topic naturally. Be professional and realistic. If the candidate says "start" or this is the beginning, introduce yourself briefly and ask the first question.`;

    const result = await callGranite(prompt);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error("mock-interview error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/resume-tips
 * Get resume tips for a specific role
 */
app.post("/api/resume-tips", async (req, res) => {
  try {
    const { role, experience } = req.body;

    const prompt = `You are a career coach specializing in the Indian job market. 

Provide 5 specific, actionable resume tips for a ${experience || "fresher"} applying for a ${role || "Software Engineer"} position in India.

For each tip:
- Give a clear heading
- Explain why it matters for Indian recruiters
- Give a concrete example

Keep the advice practical for the Indian job market (TCS, Infosys, Wipro, startups, MNCs, etc.).`;

    const result = await callGranite(prompt);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error("resume-tips error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/company-prep
 * Get company-specific interview preparation tips
 */
app.post("/api/company-prep", async (req, res) => {
  try {
    const { company, role } = req.body;

    const prompt = `You are an interview expert with deep knowledge of Indian companies and their hiring processes.

Provide a comprehensive interview preparation guide for someone applying for ${role || "Software Engineer"} at ${company || "a top IT company"} in India.

Include:
1. COMPANY OVERVIEW: Brief overview and culture (2-3 sentences)
2. INTERVIEW ROUNDS: Typical interview process/rounds
3. TECHNICAL TOPICS: Key technical areas to prepare
4. HR QUESTIONS: Common HR questions asked
5. TIPS: 3 specific tips to stand out
6. RESOURCES: Suggested preparation resources

Be specific and practical.`;

    const result = await callGranite(prompt);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error("company-prep error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Catch-all: serve frontend
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 Interview Trainer Agent running at http://localhost:${PORT}`);
  console.log(`   Model  : ${process.env.IBM_MODEL_ID}`);
  console.log(`   Project: ${process.env.IBM_PROJECT_ID}\n`);
});
