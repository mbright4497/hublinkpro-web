"use client";

import { useState } from "react";
import MediaField from "@/components/MediaField";

type Mode = "video" | "photo" | "ba";

const MODES: { id: Mode; label: string; hint: string }[] = [
  { id: "video", label: "🎥 Video", hint: "A short clip or reel of the job." },
  { id: "photo", label: "📷 Photo", hint: "One photo of the finished job." },
  { id: "ba", label: "↔ Before & after", hint: "Two photos. Visitors get a slider." },
];

// One job at a time: pick what you're adding, upload it, name it, done.
export default function WorkAddForm({
  action, userId,
}: { action: (formData: FormData) => void | Promise<void>; userId: string }) {
  const [mode, setMode] = useState<Mode>("video");
  const savedBy = "“Add to my Channel”";
  const hint = MODES.find((m) => m.id === mode)?.hint;

  return (
    <form action={action} className="workadd">
      <div className="worktabs" role="tablist" aria-label="What are you adding?">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={mode === m.id}
            className={mode === m.id ? "on" : ""}
            onClick={() => setMode(m.id)}
          >
            {m.label}
          </button>
        ))}
      </div>
      <p className="worktabhint">{hint}</p>

      {mode === "video" && (
        <MediaField key="v" name="video_url" kind="reel" savedBy={savedBy} userId={userId} label="Your video" help="Up to 50 MB. Vertical works best." />
      )}
      {mode === "photo" && (
        <MediaField key="p" name="image_url" kind="work" savedBy={savedBy} userId={userId} label="Your photo" help="JPG, PNG, or WebP, up to 8 MB." />
      )}
      {mode === "ba" && (
        <>
          <MediaField key="b" name="before_url" kind="before" savedBy={savedBy} userId={userId} label="Before" help="Same angle as the after photo works best." />
          <MediaField key="a" name="image_url" kind="work" savedBy={savedBy} userId={userId} label="After" help="JPG, PNG, or WebP, up to 8 MB." />
        </>
      )}

      <div className="field"><label htmlFor="w-title">Title</label><input id="w-title" name="title" maxLength={80} placeholder="Driveway repave, Kingsport" required /></div>
      <div className="field"><label htmlFor="w-cap">Short note (optional)</label><input id="w-cap" name="caption" maxLength={300} placeholder="Two days, 1,200 sq ft" /></div>
      <button className="btn-primary" type="submit">Add to my Channel</button>
    </form>
  );
}
