import "dotenv/config";
import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
app.use(cors());
app.use(express.json());

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 🔥 NEW — Health check endpoint for Render
app.get("/healthz", (req, res) => {
  res.status(200).send("OK");
});

// Chat route
app.post("/chat", async (req, res) => {
  try {
    const { messages, temperature = 0.6 } = req.body;

    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL,
      messages,
      temperature
    });

    const content = completion.choices[0].message.content;
    res.json({ content });
  } catch (error) {
    console.error("Error from OpenAI:", error);
    res.status(500).json({ error: "Server error" });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Coach proxy listening on port ${port}`));
