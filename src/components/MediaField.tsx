"use client";

import { useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { BUCKET } from "@/lib/media";

type Kind = "logo" | "hero" | "video" | "work" | "before";
const EXT: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp",
  "video/mp4": "mp4", "video/quicktime": "mov", "video/webm": "webm",
};

// Uploads straight from the owner's phone to our storage (their own folder only),
// then keeps the public address in a hidden input for the form to save.
export default function MediaField({
  name, kind, userId, initial, label, help,
}: { name: string; kind: Kind; userId: string; initial?: string | null; label: string; help?: string }) {
  const [url, setUrl] = useState(initial ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const pick = useRef<HTMLInputElement>(null);
  const rec = useRef<HTMLInputElement>(null);
  const isVideo = kind === "video";
  const maxMB = isVideo ? 50 : 8;

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const ext = EXT[file.type];
    if (!ext || !file.type.startsWith(isVideo ? "video/" : "image/")) {
      setMsg(isVideo ? "Use an MP4, MOV, or WebM video." : "Use a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > maxMB * 1024 * 1024) {
      setMsg(`That file is over ${maxMB} MB. ${isVideo ? "Try a shorter clip (30–60 seconds)." : "Try a smaller photo."}`);
      return;
    }
    setBusy(true);
    setMsg("");
    const sb = supabaseBrowser();
    const path = `${userId}/${kind}-${Date.now()}.${ext}`;
    const { error } = await sb.storage.from(BUCKET).upload(path, file, { contentType: file.type, cacheControl: "31536000" });
    if (error) {
      setMsg("Upload failed. Check your connection and try again.");
    } else {
      setUrl(sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl);
      setMsg("Uploaded. Press Save draft to keep it.");
    }
    setBusy(false);
  }

  return (
    <div className="field upl">
      <label>{label}</label>
      <input type="hidden" name={name} value={url} />
      {url && (
        <div className={`uplprev ${kind}`}>
          {isVideo ? (
            <video src={url} controls playsInline preload="metadata" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" />
          )}
        </div>
      )}
      <div className="uplbtns">
        {isVideo && (
          <button type="button" className="btn-primary" disabled={busy} onClick={() => rec.current?.click()}>
            🎥 Record
          </button>
        )}
        <button type="button" className={isVideo ? "btn-ghost" : "btn-primary"} disabled={busy} onClick={() => pick.current?.click()}>
          {busy ? "Uploading…" : url ? "Replace" : isVideo ? "Upload video" : "Upload photo"}
        </button>
        {url && !busy && (
          <button type="button" className="btn-ghost" onClick={() => { setUrl(""); setMsg("Removed. Press Save draft."); }}>
            Remove
          </button>
        )}
      </div>
      {isVideo && (
        <input ref={rec} type="file" accept="video/*" capture="environment" hidden onChange={onFile} />
      )}
      <input
        ref={pick}
        type="file"
        hidden
        onChange={onFile}
        accept={isVideo ? "video/mp4,video/quicktime,video/webm" : "image/jpeg,image/png,image/webp"}
      />
      {help && <small className="uplhelp">{help}</small>}
      {msg && <small className="uplmsg">{msg}</small>}
    </div>
  );
}
