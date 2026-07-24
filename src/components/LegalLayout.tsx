import Link from "next/link";

// Shared shell for the legal pages (/privacy, /terms, /sms).
// Carriers and TCR reviewers must be able to reach these without logging in
// and must be able to hop between them — hence the cross-links at the bottom.
export default function LegalLayout({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <nav className="nav">
        <Link href="/" className="brand">
          <span className="logo">H</span>
          HubLink<span className="pro">Pro</span>
        </Link>
        <span className="navlinks">
          <Link href="/">← Back to HubLinkPro</Link>
        </span>
        <span />
      </nav>

      <div className="page legal">
        <h1>{title}</h1>
        <p className="legal-updated">
          Last updated {updated} · HubLinkPro, a brand of Bright LLC · Johnson City, Tennessee
        </p>
        {children}

        <div className="legal-nav">
          <Link href="/terms">Terms of Service</Link>
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/sms">SMS Terms</Link>
        </div>
        <p className="legal-contact">
          Questions about this policy? Email{" "}
          <a href="mailto:support@hublinkpro.com">support@hublinkpro.com</a> or write to
          HubLinkPro, Johnson City, TN 37604.
        </p>
      </div>
    </>
  );
}
