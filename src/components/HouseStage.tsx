import Link from "next/link";
import type { HouseStage as Stage } from "@/lib/channels";

// Top-of-page "this is what a Channel looks like" stage: our own live Channel, playing.
export default function HouseStage({ stage }: { stage: Stage }) {
  const href = `/channel/${stage.slug}`;
  return (
    <section className="stage" id="your-channel" aria-label="See a live Channel">
      <div className="stage-glow" aria-hidden="true" />
      <div className="stage-copy">
        <span className="stage-badge">
          <span className="ping" /> Live Channel · This one is ours
        </span>
        <h2>This is what your Channel looks like.</h2>
        <p>
          Your video. Your services. A book button. Your socials. One page that does the selling
          while you work. Press play, then picture your name on it.
        </p>
        <ul className="stage-chips">
          <li>🎬 Video</li>
          <li>🛠️ Services</li>
          <li>📅 Book direct</li>
          <li>📲 Socials</li>
        </ul>
        <div className="hero-cta" style={{ marginBottom: 0 }}>
          <Link href="/login" className="btn-primary">
            Build your Channel, free →
          </Link>
          <Link href={href} className="btn-ghost">
            Tour the full Channel
          </Link>
        </div>
      </div>
      <div className="stage-screen">
        <div className="stage-frame">
          {stage.videoFile ? (
            <video
              controls
              playsInline
              preload="metadata"
              poster={stage.poster ?? undefined}
              src={stage.videoFile}
            />
          ) : stage.videoEmbed ? (
            <iframe
              src={stage.videoEmbed}
              title={`${stage.name} video`}
              allow="accelerometer; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              loading="lazy"
            />
          ) : (
            <Link href={href} className="stage-play" aria-label="Open the Channel">
              <span>▶</span>
            </Link>
          )}
        </div>
        <div className="stage-cap">
          <b>{stage.name}</b>
          {stage.tagline && <span>{stage.tagline}</span>}
        </div>
      </div>
    </section>
  );
}
