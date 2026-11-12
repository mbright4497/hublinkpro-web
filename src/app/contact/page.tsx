import Link from "next/link";
import { sendMessage } from "./actions";

export const metadata = {
  title: "Message us | HubLinkPro",
  description: "Send a message straight to the HubLinkPro team.",
};

export default async function Contact({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  return (
    <>
      <nav className="nav">
        <Link href="/" className="brand">
          <span className="logo">H</span>
          <span>HubLink<span className="pro">Pro</span></span>
        </Link>
        <span />
        <Link href="/" className="signin">← Back to discover</Link>
      </nav>
      <div className="page" style={{ maxWidth: 560 }}>
        <h1>Message us</h1>
        <p className="lead">
          Questions, ideas, or want your business on HubLinkPro? Send it straight to our team.
        </p>
        {sp.sent ? (
          <div className="bookbox">
            <h3>Got it. Thank you.</h3>
            <p className="lead">We read every message and will reply to the email you gave.</p>
            <Link href="/" className="btn-ghost">Back to the homepage</Link>
          </div>
        ) : (
          <form action={sendMessage} className="bookbox">
            {sp.error && <p className="note">Add your name, a valid email, and a message.</p>}
            <div style={{ position: "absolute", left: "-9999px" }} aria-hidden="true">
              <label>Leave this empty<input name="company_site" tabIndex={-1} autoComplete="off" /></label>
            </div>
            <div className="field">
              <label htmlFor="c-name">Your name</label>
              <input id="c-name" name="name" required maxLength={120} autoComplete="name" />
            </div>
            <div className="field">
              <label htmlFor="c-email">Email</label>
              <input id="c-email" name="email" type="email" required maxLength={200} autoComplete="email" />
            </div>
            <div className="field">
              <label htmlFor="c-msg">Message</label>
              <textarea id="c-msg" name="message" rows={6} required maxLength={4000} />
            </div>
            <button className="btn-primary" type="submit">Send message</button>
          </form>
        )}
      </div>
    </>
  );
}
