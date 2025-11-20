// index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/chat", async (req, res) => {
  try {
    const { messages, temperature } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages must be a non-empty array" });
    }

    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",          // keep this as-is for now
      messages,
      temperature: temperature ?? 0.6,
    });

    const content = completion.choices[0]?.message?.content ?? "";
    return res.json({ content });
  } catch (err) {
    // 🔍 MUCH more detailed logging
    console.error("=== OpenAI / Proxy Error ===");
    if (err.response?.data) {
      console.error("Response data:", JSON.stringify(err.response.data, null, 2));
    }
    console.error("Message:", err.message);
    console.error("Stack:", err.stack);

    // Send something readable back to the app
    const errorPayload =
      err.response?.data ??
      { message: err.message ?? "Unknown error from OpenAI" };

    res.status(500).json({ error: errorPayload });
  }
});

app.listen(port, () => {
  console.log(`✅ Coach proxy listening on http://localhost:${port}`);
});
