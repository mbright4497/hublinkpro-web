"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { HouseStage } from "@/lib/channels";

// Full-bleed cinematic opener. Plays the house Channel video muted behind the headline.
// A portrait clip (phone video) becomes a tall framed screen on the right instead of being
// cropped to a blur; on phones it fills the screen. No video: brand glow, still cinematic.
export default function Billboard({ stage, eyebrow }: { stage: HouseStage | null; eyebrow: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [portrait, setPortrait] = useState(false);
  const [ready, setReady] = useState(false);
  const [muted, setMuted] = useState(true);
  const [failed, setFailed] = useState(false);
  const src = stage?.videoFile ?? null;
  const href = stage ? `/channel/${stage.slug}` : "/login";

  useEffect(() => {
    const v = ref.current;
    if (v && window.matchMedia("(prefers-reduced-motion: reduce)").matches) v.pause();
  }, []);

  return (
    <section className="bb" id="discover">
      <div className={`bb-media ${portrait ? "is-portrait" : "is-wide"} ${ready ? "is-ready" : ""}`}>
        {src && !failed && (
          <video
            ref={ref}
            className="bb-video"
            src={src}
            poster={stage?.poster ?? undefined}
            autoPlay
            loop
            muted={muted}
            playsInline
            preload="auto"
            onLoadedMetadata={(e) => {
              const v = e.currentTarget;
              setPortrait(v.videoHeight > v.videoWidth);
              setReady(true);
            }}
            onError={() => setFailed(true)}
          />
        )}
      </div>
      <div className="bb-glow" aria-hidden="true" />
      <div className="bb-scrim" aria-hidden="true" />

      <div className="bb-in">
        <span className="bb-eyebrow">
          <span className="ping" /> {eyebrow}
        </span>
        <h1>Meet your local pros. Book them direct.</h1>
        <p className="bb-lead">
          Every business gets its own Channel: a video, what they do, and a button to book.
          Watch them. Pick one. Done.
        </p>
        <div className="bb-cta">
          <Link href={href} className="bb-play">
            <span aria-hidden="true">▶</span> Watch a Channel
          </Link>
          <Link href="/login" className="bb-more">
            ＋ Build your Channel, free
          </Link>
        </div>
        <p className="bb-signin">
          Already have a Channel? <Link href="/login?mode=signin">Sign in</Link>
        </p>
      </div>

      {src && !failed && ready && (
        <button
          type="button"
          className="bb-mute"
          onClick={() => setMuted((m) => !m)}
          aria-label={muted ? "Turn sound on" : "Turn sound off"}
        >
          {muted ? "🔇" : "🔊"}
        </button>
      )}
    </section>
  );
}
