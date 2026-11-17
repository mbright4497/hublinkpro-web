"use client";
import { useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

export default function ChannelChat({ slug, name }: { slug: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  async function send(q: string) {
    const content = q.trim().slice(0, 500);
    if (!content || busy) return;
    const next: Msg[] = [...msgs, { role: "user", content }];
    setMsgs(next); setText(""); setBusy(true);
    try {
      const r = await fetch("/api/channel-chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug, messages: next }) });
      const d = (await r.json().catch(() => ({}))) as { reply?: string };
      setMsgs([...next, { role: "assistant", content: d.reply ?? "Sorry, I can't answer right now. Please use Book a time on this page." }]);
    } catch {
      setMsgs([...next, { role: "assistant", content: "Sorry, I can't answer right now. Please use Book a time on this page." }]);
    } finally {
      setBusy(false);
      setTimeout(() => end.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }), 50);
    }
  }

  if (!open) {
    return <p style={{ margin: "0 0 24px" }}><button type="button" className="btn-ghost" onClick={() => setOpen(true)}>💬 Ask Link</button></p>;
  }
  const starters = ["What services do you offer?", "Do you serve my area?", "How do I book?"];
  return (
    <section className="chatbox" aria-label="Ask Link">
      <div className="chathead">
        <b>Ask Link</b>
        <button type="button" className="chatx" onClick={() => setOpen(false)} aria-label="Close chat">×</button>
      </div>
      <p className="hint" style={{ margin: "0 0 10px" }}>Hi, I'm Link, HubLinkPro's AI assistant. I answer from {name}'s Channel only. Book a time to confirm prices and availability.</p>
      <div className="chatlog" aria-live="polite">
        {msgs.length === 0 && <div className="chatchips">{starters.map((s) => <button key={s} type="button" className="chip" onClick={() => send(s)}>{s}</button>)}</div>}
        {msgs.map((m, i) => <div key={i} className={`chatmsg ${m.role}`}>{m.content}</div>)}
        {busy && <div className="chatmsg assistant">…</div>}
        <div ref={end} />
      </div>
      <form className="chatform" onSubmit={(e) => { e.preventDefault(); send(text); }}>
        <input value={text} onChange={(e) => setText(e.target.value)} maxLength={500} placeholder="Type your question" aria-label="Your question" />
        <button type="submit" className="btn-primary" disabled={busy || !text.trim()}>Send</button>
      </form>
    </section>
  );
}
