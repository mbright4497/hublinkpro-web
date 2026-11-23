import Link from "next/link";

// Compact legal footer for pages that are not the full site footer (Channel pages).
// Carriers and TCR reviewers open the opt-in page and look for: Terms, Privacy, SMS Terms,
// and a clear tie between the brand people see and the registered business (Bright LLC).
export default function LegalFooter() {
  return (
    <footer className="legalfoot">
      <div className="footlegal">
        <Link href="/terms">Terms of Service</Link>
        <Link href="/privacy">Privacy Policy</Link>
        <Link href="/sms">SMS Terms</Link>
      </div>
      <p>
        HubLinkPro, a brand of Bright LLC · Johnson City, TN 37604 ·{" "}
        <a href="mailto:support@hublinkpro.com">support@hublinkpro.com</a>
      </p>
      <p>
        HubLinkPro is a directory; we do not perform, vouch for, or guarantee the work of any
        listed business.
      </p>
    </footer>
  );
}
