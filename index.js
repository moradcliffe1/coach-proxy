// index.js
// Coach Achilix / Chat Proxy + Cross-Device Sync

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// OpenAI client (for /chat)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Health check
app.get("/", (req, res) => {
  res.json({ status: "ok", service: "coach-proxy" });
});

// CHAT ROUTE  ------------------------------------------------------
app.post("/chat", async (req, res) => {
  try {
    const { messages, temperature } = req.body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages[] is required" });
    }

    // Map to OpenAI format
    const openAIMessages = messages.map(m => ({
      role: m.role,
      content: m.content
    }));

    const completion = await openai.chat.completions.create({
      model: process.env.COACH_MODEL || "gpt-4o-mini",
      messages: openAIMessages,
      temperature: typeof temperature === "number" ? temperature : 0.6
    });

    const content = completion.choices?.[0]?.message?.content ?? "";

    return res.json({ content });
  } catch (err) {
    console.error("Error in /chat:", err);
    return res.status(500).json({ error: "Server error talking to OpenAI" });
  }
});

// ------------------------------------------------------------------
// CONVERSATION SYNC (in-memory for MVP)

// userId → conversations[]
const conversationsByUser = Object.create(null);

// GET /conversations?userId=XYZ
app.get("/conversations", (req, res) => {
  const userId = req.query.userId;

  if (!userId) {
    return res.status(400).json({ error: "userId query param is required" });
  }

  const conversations = conversationsByUser[userId] || [];
  return res.json({ conversations });
});

// POST /conversations/sync
app.post("/conversations/sync", (req, res) => {
  try {
    const { userId, conversations } = req.body || {};

    if (!userId || !Array.isArray(conversations)) {
      return res
        .status(400)
        .json({ error: "Invalid payload: { userId, conversations[] } required" });
    }

    // Save conversations (overwrite for now)
    conversationsByUser[userId] = conversations;

    return res.json({ conversations: conversationsByUser[userId] });
  } catch (err) {
    console.error("Error in /conversations/sync:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// Start server
app.listen(port, () => {
  console.log(`✅ coach-proxy listening on port ${port}`);
});

