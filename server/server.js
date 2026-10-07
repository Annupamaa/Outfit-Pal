import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { GoogleGenAI, Type } from "@google/genai";
import Chat from "./models/Chat.js";

const { GEMINI_API_KEY, MONGODB_URI } = process.env;
const MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
const PORT = process.env.PORT || 5050;
const MAX_HISTORY = 20; // messages sent to Gemini each turn

if (!GEMINI_API_KEY || !MONGODB_URI) {
  console.error("Missing GEMINI_API_KEY or MONGODB_URI. Copy server/.env.example to server/.env and fill it in.");
  process.exit(1);
}
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const SYSTEM = `You are Outfit Pal, a friendly personal stylist.
- Remember everything the user said earlier (size, budget, style, climate, occasions, dislikes) and use it.
- If the user shares a photo, describe what you see (clothing, colours, fit) and build on it.
- When recommending, give 1-3 complete outfits. Each item needs a real colour as a hex code.
- If you need key info (occasion, weather, budget), ask ONE short question in "reply" and return no outfits.
- Only discuss fashion, styling, grooming and shopping. Politely redirect anything else.
- Keep "reply" to 1-3 warm, concise sentences. Put details in the outfits.`;

const schema = {
  type: Type.OBJECT,
  properties: {
    reply: { type: Type.STRING },
    outfits: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          occasion: { type: Type.STRING },
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, description: "top, bottom, outerwear, dress, shoes, or accessory" },
                name: { type: Type.STRING },
                color_hex: { type: Type.STRING, description: "e.g. #2F4858" },
              },
              required: ["type", "name", "color_hex"],
            },
          },
          tip: { type: Type.STRING },
        },
        required: ["name", "items"],
      },
    },
  },
  required: ["reply", "outfits"],
};

const app = express();
app.use(express.json({ limit: "10mb" }));

const validId = (id) => mongoose.isValidObjectId(id);

// Send a message (creates a chat on first message)
app.post("/api/chat", async (req, res) => {
  const { message = "", image, chatId } = req.body || {};
  if (!message.trim() && !image) return res.status(400).json({ error: "Send a message or a photo." });

  try {
    let chat = chatId && validId(chatId) ? await Chat.findById(chatId) : null;
    if (!chat) chat = new Chat({ messages: [] });

    // Rebuild Gemini history from MongoDB (text only; photos are not re-sent)
    const history = chat.messages.slice(-MAX_HISTORY).map((m) => ({
      role: m.role,
      parts: [{
        text: m.role === "model"
          ? JSON.stringify({ reply: m.text, outfits: m.outfits || [] })
          : (m.hasImage ? `[user shared a photo] ${m.text}` : m.text),
      }],
    }));

    const parts = [];
    if (image?.data && image?.mimeType?.startsWith("image/")) {
      parts.push({ inlineData: { mimeType: image.mimeType, data: image.data } });
    }
    parts.push({ text: message.trim() || "Here is a photo. What do you think, and what should I wear with it?" });

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [...history, { role: "user", parts }],
      config: { systemInstruction: SYSTEM, responseMimeType: "application/json", responseSchema: schema, temperature: 0.9 },
    });

    let data;
    try { data = JSON.parse(response.text); }
    catch { data = { reply: response.text || "Sorry, try that again.", outfits: [] }; }

    chat.messages.push(
      { role: "user", text: message, hasImage: !!image },
      { role: "model", text: data.reply, outfits: data.outfits || [] }
    );
    await chat.save();

    res.json({ chatId: chat._id, reply: data.reply, outfits: data.outfits || [] });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: "The stylist is unavailable right now. Check your API key and database, then try again." });
  }
});

// Load a saved chat
app.get("/api/chat/:id", async (req, res) => {
  if (!validId(req.params.id)) return res.status(404).json({ error: "Chat not found." });
  const chat = await Chat.findById(req.params.id).lean();
  if (!chat) return res.status(404).json({ error: "Chat not found." });
  res.json({ messages: chat.messages });
});

// Delete a chat
app.delete("/api/chat/:id", async (req, res) => {
  if (validId(req.params.id)) await Chat.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

// Serve the built React app in production
const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), "../client/dist");
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get("*", (req, res) => res.sendFile(path.join(dist, "index.html")));
}

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`API running at http://localhost:${PORT} (model: ${MODEL})`));
  })
  .catch((e) => { console.error("MongoDB connection failed:", e.message); process.exit(1); });
