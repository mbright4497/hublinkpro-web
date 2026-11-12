import Link from "next/link";

// The up-front explainer: what HubLinkPro is, and exactly how to use it, in plain words.
// Two tracks, three steps each. Nothing here is a claim we can't back up today.
const NEIGHBORS = [
  { n: "1", h: "Pick a service", p: "Roofing, plumbing, lawn care, food trucks. Choose what you need." },
  { n: "2", h: "Watch their Channel", p: "Each business introduces itself: a short video, what they do, where they work." },
  { n: "3", h: "Tap Book", p: "Book straight with the business. No bidding, no middleman." },
];

const OWNERS = [
  { n: "1", h: "Create your login", p: "Pick a password and you are in. Takes a minute." },
  { n: "2", h: "Build your Channel", p: "Add your name, services, a video, and your booking link." },
  { n: "3", h: "Share your link", p: "Put it on your Facebook, your invoices, your truck. Customers book you direct." },
];

export default function HowItWorks() {
  return (
    <section className="section how" id="how-it-works">
      <div className="badge">How HubLinkPro works</div>
      <h2>Every local business gets its own Channel.</h2>
      <p className="sub how-sub">
        A Channel is a business&apos;s home on HubLinkPro: who they are, what they do, a short
        video, and a button to book them. Neighbors find the right pro and book direct.
      </p>

      <div className="howgrid">
        <div className="howcard">
          <h3>Need a pro?</h3>
          <ol className="steps">
            {NEIGHBORS.map((s) => (
              <li key={s.n}>
                <span className="stepn">{s.n}</span>
                <span>
                  <b>{s.h}</b>
                  <small>{s.p}</small>
                </span>
              </li>
            ))}
          </ol>
          <a href="#networks" className="btn-primary">
            Browse services
          </a>
        </div>

        <div className="howcard owner">
          <h3>Own a business?</h3>
          <ol className="steps">
            {OWNERS.map((s) => (
              <li key={s.n}>
                <span className="stepn">{s.n}</span>
                <span>
                  <b>{s.h}</b>
                  <small>{s.p}</small>
                </span>
              </li>
            ))}
          </ol>
          <div className="hero-cta" style={{ marginTop: 0 }}>
            <Link href="/login" className="btn-primary">
              Build your Channel, free
            </Link>
            <Link href="/business/hublinkpro" className="btn-ghost">
              See an example
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
