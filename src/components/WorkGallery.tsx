"use client";

import { useEffect, useRef, useState } from "react";
import WorkAddForm from "@/components/WorkAddForm";

export type WorkItem = {
  id: number;
  title: string;
  caption: string | null;
  image_url: string | null;
  before_url: string | null;
  video_url: string | null;
};

function BeforeAfter({ before, after, alt }: { before: string; after: string; alt: string }) {
  const [pos, setPos] = useState(50);
  const box = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  function move(clientX: number) {
    const r = box.current?.getBoundingClientRect();
    if (!r) return;
    setPos(Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100)));
  }

  return (
    <div
      ref={box}
      className="ba"
      onPointerDown={(e) => { dragging.current = true; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); move(e.clientX); }}
      onPointerMove={(e) => { if (dragging.current) move(e.clientX); }}
      onPointerUp={() => { dragging.current = false; }}
      onPointerCancel={() => { dragging.current = false; }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={after} alt={`${alt} after`} draggable={false} />
      <div className="ba-before" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={before} alt={`${alt} before`} draggable={false} />
      </div>
      <span className="ba-tag l">Before</span>
      <span className="ba-tag r">After</span>
      <div className="ba-handle" style={{ left: `${pos}%` }} aria-hidden="true"><span>⇆</span></div>
      <input
        className="ba-range"
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label="Before and after slider"
      />
    </div>
  );
}

export default function WorkGallery({
  items,
  name,
  heading = "Our work",
  nextUp,
  adder,
}: {
  items: WorkItem[];
  name: string;
  heading?: string;
  /** Optional trailing "coming soon" card, shown after the last item. Not clickable. */
  nextUp?: string;
  /** Only passed for the Channel's owner: turns the coming-soon card into an add button. */
  adder?: { userId: string; action: (formData: FormData) => void | Promise<void> };
}) {
  const [open, setOpen] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const cur = open !== null ? items[open] : null;

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((i) => (i === null ? i : (i + 1) % items.length));
      if (e.key === "ArrowLeft") setOpen((i) => (i === null ? i : (i - 1 + items.length) % items.length));
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open, items.length]);

  if (items.length === 0) return null;

  return (
    <section className="workrow" aria-label={`${name} recent work`}>
      <h2 style={{ fontSize: 20, marginTop: 8 }}>{heading}</h2>
      <div className="workscroll">
        {items.map((w, i) => (
          <button key={w.id} type="button" className="workcard" onClick={() => setOpen(i)} aria-label={`Open ${w.title}`}>
            {w.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={w.image_url} alt="" loading="lazy" />
            ) : (
              <video src={`${w.video_url}#t=0.1`} muted playsInline preload="metadata" />
            )}
            {w.video_url && <span className="workplay" aria-hidden="true">▶</span>}
            {w.before_url && !w.video_url && <span className="workbadge">Before / After</span>}
            <span className="worktitle">{w.title}{w.caption && <span className="workcap">{w.caption}</span>}</span>
          </button>
        ))}
        {nextUp && adder && (
          <button type="button" className="workcard soon owner" onClick={() => setAdding(true)} aria-label="Add a video or photo">
            <span className="workbadge">Only you see this</span>
            <span className="worktitle">＋ Add video or photo<span className="workcap">Visitors see “{nextUp}” here.</span></span>
          </button>
        )}
        {nextUp && !adder && (
          <div className="workcard soon" role="group" aria-label={`${nextUp}, coming soon`}>
            <span className="workbadge">Coming soon</span>
            <span className="worktitle">{nextUp}</span>
          </div>
        )}
      </div>

      {adding && adder && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label="Add a video or photo" onClick={() => setAdding(false)}>
          <div className="lbbody addbody" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="lbclose" onClick={() => setAdding(false)} aria-label="Close">✕</button>
            <h3 style={{ margin: "0 0 12px" }}>Add to {name}</h3>
            <WorkAddForm action={adder.action} userId={adder.userId} returnTo="channel" />
          </div>
        </div>
      )}

      {cur && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={cur.title} onClick={() => setOpen(null)}>
          <div className="lbbody" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="lbclose" onClick={() => setOpen(null)} aria-label="Close">✕</button>
            {cur.video_url ? (
              <video key={cur.id} src={cur.video_url} className="lbvideo" controls autoPlay playsInline poster={cur.image_url ?? undefined} />
            ) : cur.before_url && cur.image_url ? (
              <BeforeAfter key={cur.id} before={cur.before_url} after={cur.image_url} alt={cur.title} />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cur.image_url ?? ""} alt={cur.title} className="lbimg" />
            )}
            <div className="lbcap">
              <strong>{cur.title}</strong>
              {cur.caption && <p>{cur.caption}</p>}
            </div>
            {items.length > 1 && (
              <div className="lbnav">
                <button type="button" onClick={() => setOpen((open! - 1 + items.length) % items.length)} aria-label="Previous">‹</button>
                <span>{(open ?? 0) + 1} / {items.length}</span>
                <button type="button" onClick={() => setOpen((open! + 1) % items.length)} aria-label="Next">›</button>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
