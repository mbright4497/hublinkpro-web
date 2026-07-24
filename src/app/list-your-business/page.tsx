"use client";

import Link from "next/link";
import { useState } from "react";

// The EXACT wording the user agrees to. This string is stored with every submission —
// carriers and TCR can demand proof of what was consented to, verbatim. If you change
// the checkbox copy below, change it here too; they must always match.
const SMS_CONSENT_TEXT =
  "I agree to receive text messages from HubLinkPro about my listing, my leads, and my account. Message frequency varies. Message and data rates may apply. Reply STOP to opt out, HELP for help. Consent is not a condition of purchase.";

export default function ListYourBusiness() {
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    const smsConsent = data.sms_consent === "on";
    try {
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          source: "list-your-business",
          // Consent record — proof of opt-in. Never infer this; only ever set it
          // from the box the user actually checked.
          sms_consent: smsConsent,
          sms_consent_text: smsConsent ? SMS_CONSENT_TEXT : null,
          sms_consent_at: smsConsent ? new Date().toISOString() : null,
          consent_page: typeof window !== "undefined" ? window.location.href : null,
        }),
      });
      setStatus(res.ok ? "done" : "error");
      if (res.ok) form.reset();
    } catch {
      setStatus("error");
    }
  }

  return (
    <>
      <nav className="nav">
        <Link href="/" className="brand">
          <span className="logo">H</span>
          HubLink<span className="pro">Pro</span>
        </Link>
        <span className="navlinks">
          <Link href="/">← Back</Link>
        </span>
        <span />
      </nav>

      <div className="page">
        <h1>List your business</h1>
        <p className="lead">
          Claim your neighborhood. Never more than 3 pros per service, per area — so the slot
          you take is a slot your competitor can&apos;t. Free to start. Food trucks free forever.
        </p>

        {status === "done" ? (
          <div className="autocard" style={{ borderColor: "var(--color-brand)" }}>
            <div className="ic">✅</div>
            <h3>You&apos;re in the queue.</h3>
            <p>We&apos;ll reach out to verify your listing and lock your neighborhood slot. Welcome to HubLinkPro.</p>
          </div>
        ) : (
          <form onSubmit={onSubmit}>
            <div className="field">
              <label>Business name</label>
              <input name="business" required placeholder="Reliable Paving" />
            </div>
            <div className="field">
              <label>Your name</label>
              <input name="name" required placeholder="Joe Smith" />
            </div>
            <div className="field">
              <label>Email</label>
              <input name="email" type="email" required placeholder="joe@reliablepaving.com" />
            </div>
            <div className="field">
              <label>Phone</label>
              <input name="phone" placeholder="(423) 555-0123" />
            </div>
            <div className="field">
              <label>Category</label>
              <input name="category" placeholder="Paving & Asphalt" />
            </div>
            <div className="field">
              <label>Neighborhood / ZIP you serve</label>
              <input name="area" placeholder="37604 · Johnson City" />
            </div>
            {/* SMS consent — MUST render unchecked. A pre-checked box is an
                automatic A2P/TCR failure. Do not add defaultChecked. */}
            <label className="consent">
              <input type="checkbox" name="sms_consent" />
              <span>
                I agree to receive text messages from HubLinkPro about my listing, my leads, and
                my account. Message frequency varies. Message and data rates may apply. Reply{" "}
                <b>STOP</b> to opt out, <b>HELP</b> for help. Consent is not a condition of
                purchase. See our <Link href="/sms">SMS Terms</Link> and{" "}
                <Link href="/privacy">Privacy Policy</Link>.
              </span>
            </label>

            <button className="btn-primary" type="submit" disabled={status === "sending"}>
              {status === "sending" ? "Sending…" : "Claim my slot →"}
            </button>

            <p className="finelegal">
              By submitting, you agree to our <Link href="/terms">Terms of Service</Link> and{" "}
              <Link href="/privacy">Privacy Policy</Link>. We do not sell or share your phone
              number or your SMS consent with third parties for marketing.
            </p>
            {status === "error" && (
              <p style={{ color: "#f87171", marginTop: 14 }}>
                Something went wrong — try again, or email us at hello@hublinkpro.com.
              </p>
            )}
          </form>
        )}
      </div>
    </>
  );
}
