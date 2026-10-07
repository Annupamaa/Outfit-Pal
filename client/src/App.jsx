import { useEffect, useRef, useState } from "react";
import OutfitCard from "./OutfitCard.jsx";

const SUGGESTIONS = [
  "Casual college day, warm weather",
  "Job interview, budget ₹3000",
  "Wedding guest, evening",
];

export default function App() {
  const [chatId, setChatId] = useState(() => localStorage.getItem("outfitpal-chat"));
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [image, setImage] = useState(null); // { url, data, mimeType }
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);
  const fileRef = useRef(null);

  // Restore saved conversation from MongoDB
  useEffect(() => {
    if (!chatId) return;
    fetch(`/api/chat/${chatId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) setMessages(d.messages);
        else { localStorage.removeItem("outfitpal-chat"); setChatId(null); }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  async function send(text) {
    if ((!text.trim() && !image) || loading) return;
    const img = image;
    setMessages((m) => [...m, { role: "user", text, hasImage: !!img, imageUrl: img?.url }]);
    setInput("");
    setImage(null);
    if (fileRef.current) fileRef.current.value = "";
    setLoading(true);
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          chatId,
          image: img && { data: img.data, mimeType: img.mimeType },
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setChatId(data.chatId);
      localStorage.setItem("outfitpal-chat", data.chatId);
      setMessages((m) => [...m, { role: "model", text: data.reply, outfits: data.outfits }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "model", text: e.message || "Can't reach the server.", error: true }]);
    } finally {
      setLoading(false);
    }
  }

  function pickFile(e) {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 6 * 1024 * 1024) {
      alert("Please pick a photo under 6 MB.");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImage({ url: reader.result, data: reader.result.split(",")[1], mimeType: f.type });
    reader.readAsDataURL(f);
  }

  async function newChat() {
    if (chatId) await fetch(`/api/chat/${chatId}`, { method: "DELETE" }).catch(() => {});
    localStorage.removeItem("outfitpal-chat");
    setChatId(null);
    setMessages([]);
  }

  return (
    <div className="app">
      <header>
        <h1>Outfit Pal</h1>
        <button id="reset" type="button" onClick={newChat}>New chat</button>
      </header>

      <main aria-live="polite">
        {messages.length === 0 && (
          <div className="empty">
            <p className="lead">What are you dressing for?</p>
            <div className="chips">
              {SUGGESTIONS.map((s) => (
                <button key={s} type="button" onClick={() => send(s)}>{s}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="msg user">
              {m.imageUrl && <img src={m.imageUrl} alt="Your photo" />}
              {m.hasImage && !m.imageUrl && <em>(photo attached) </em>}
              {m.text}
            </div>
          ) : (
            <div key={i} className={`msg bot${m.error ? " err" : ""}`}>
              <div className="text">{m.text}</div>
              {m.outfits?.length > 0 && (
                <div className="outfits">
                  {m.outfits.map((o, j) => <OutfitCard key={j} outfit={o} />)}
                </div>
              )}
            </div>
          )
        )}
        {loading && <div className="msg typing">Styling…</div>}
        <div ref={endRef} />
      </main>

      <form onSubmit={(e) => { e.preventDefault(); send(input); }}>
        {image && (
          <div id="preview">
            <img src={image.url} alt="Selected photo" />
            <button type="button" id="clear" aria-label="Remove photo" onClick={() => { setImage(null); fileRef.current.value = ""; }}>×</button>
          </div>
        )}
        <div className="row">
          <label className="attach" title="Add a photo">
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickFile} />
            <span>Photo</span>
          </label>
          <input
            id="input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe the occasion, or add a photo of a clothing item"
            autoComplete="off"
          />
          <button id="send" type="submit" disabled={loading}>Send</button>
        </div>
      </form>
    </div>
  );
}
