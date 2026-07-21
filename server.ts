import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "2mb" }));

// Initialize Gemini client lazily/safely
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// API Route for JEE AI Study Assistant
app.post("/api/chat", async (req: Request, res: Response) => {
  try {
    const { message, topic, history, subject } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "A non-empty 'message' string is required." });
    }

    const ai = getGeminiClient();

    const systemInstruction = `You are a world-class JEE (Joint Entrance Examination) AI Tutor and Study Assistant specializing in Physics, Chemistry, and Mathematics for JEE Main & JEE Advanced.

Current Student Context:
- Subject: ${subject || "General JEE"}
- Topic / Chapter: ${topic || "General Study"}

Guidelines:
1. Provide accurate, clear, and structured explanations tailored for JEE level.
2. Use LaTeX mathematical notation ($...$ for inline or $$...$$ for block formulas) whenever writing equations or formulas.
3. Include key formulas, step-by-step problem-solving methods, common traps, or shortcuts when applicable.
4. Keep answers concise, highly legible, and structured with bullet points or numbered lists where helpful.
5. If the user asks for practice problems, provide realistic JEE Main / Advanced level questions with step-by-step solutions.
6. If the student explicitly asks you to make code/state changes (e.g., reset study hours, change start date to July 22nd, pump down chapter health scores, trigger rescue mode, or change daily targets), explain politely what action you are taking, and include a JSON action block at the very end of your reply:
\`\`\`json
{"action": "SET_PLAN_START", "payload": "2026-07-22"}
\`\`\`
Supported actions:
- {"action": "SET_PLAN_START", "payload": "2026-07-22"}
- {"action": "PUMP_DOWN_HEALTH"}
- {"action": "RESET_STUDY_HOURS"}
- {"action": "TRIGGER_RESCUE_MODE"}
- {"action": "SET_DAILY_TARGET", "payload": 6}`;

    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    if (Array.isArray(history)) {
      for (const h of history) {
        if (h && typeof h.text === "string") {
          contents.push({
            role: h.role === "user" ? "user" : "model",
            parts: [{ text: h.text }],
          });
        }
      }
    }

    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const replyText = response.text || "I apologize, but I could not generate a response. Please try again.";
    return res.json({ reply: replyText });
  } catch (err: any) {
    console.error("Error in /api/chat:", err);
    return res.status(500).json({
      error: err.message || "An error occurred while contacting the JEE AI Tutor.",
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`JEE Study Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
