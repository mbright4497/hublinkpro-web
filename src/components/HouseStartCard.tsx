"use client";

import Link from "next/link";
import { useRef } from "react";
import type { HouseStage } from "@/lib/channels";

// First poster in "Browse by genre": our own live Channel. Plays a muted preview on hover,
// and a click opens the Channel. Real data only: logo, intro video, cover photo if there is one.
export default function HouseStartCard({ stage }: { stage: HouseStage }) {
  const vid = useRef<HTMLVideoElement>(null);
  const src = stage.videoFile;

  function play() {
    const v = vid.current;
    if (!v || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    v.play().catch(() => {});
  }
  function stop() {
    const v = vid.current;
    if (!v) return;
    v.pause();
    v.currentTime = 0.1;
  }

  return (
    <Link
      href={`/channel/${stage.slug}`}
      className="poster npost start"
      aria-label={`Watch the ${stage.name} Channel`}
      onMouseEnter={play}
      onMouseLeave={stop}
      onFocus={play}
      onBlur={stop}
    >
      {stage.poster && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="startbg" src={stage.poster} alt="" loading="lazy" />
      )}
      {src && (
        <video ref={vid} className="startbg" src={`${src}#t=0.1`} muted loop playsInline preload="metadata" />
      )}
      <span className="pshade" />
      {stage.logoUrl && (
        <span className="plogo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={stage.logoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }} />
        </span>
      )}
      <span className="pv">LIVE CHANNEL</span>
      <span className="pbody">
        <span className="pname">{stage.name}</span>
        <span className="pcat">Start here</span>
      </span>
      <span className="reveal">
        <span className="pname">{stage.name}</span>
        {stage.tagline && <span className="tag">{stage.tagline}</span>}
        <span className="qbtns">
          <span className="q1">▶ Watch the Channel</span>
        </span>
      </span>
    </Link>
  );
}
