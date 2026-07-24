import type { Metadata } from "next";
import LegalLayout from "@/components/LegalLayout";

export const metadata: Metadata = {
  title: "Privacy Policy · HubLinkPro",
  description:
    "How HubLinkPro collects, uses, and protects your information — including mobile phone numbers and SMS consent.",
};

export default function Privacy() {
  return (
    <LegalLayout title="Privacy Policy" updated="July 24, 2026">
      <p className="legal-callout">
        <b>The one that matters most:</b> HubLinkPro does not sell, rent, or share your mobile
        phone number, your SMS consent, or your opt-in data with third parties or affiliates for
        their own marketing purposes. Ever.
      </p>

      <p>
        This policy explains what HubLinkPro (&quot;we,&quot; &quot;us&quot;) collects, why we
        collect it, who sees it, and what you can do about it. It covers hublinkpro.com, our
        landing pages and funnels (including pages hosted at go.hublinkpro.com), and the messages
        we send you.
      </p>

      <h2>1. Information we collect</h2>
      <ul>
        <li>
          <b>Information you give us.</b> Name, email address, mobile phone number, street address
          or ZIP code, the service you are asking about, and anything you type into a form or send
          us in a message. If you are a business, also your business name, category, and service
          area.
        </li>
        <li>
          <b>Consent records.</b> When you check an SMS or contact consent box, we store the exact
          wording you agreed to, the date and time, the page you were on, and your IP address.
          This is how we prove your consent was real if a carrier or regulator asks.
        </li>
        <li>
          <b>Automatically collected information.</b> Approximate location derived from your IP
          address (used to show you local businesses), device and browser type, pages viewed, and
          referring source. Collected through cookies and similar technologies, including Google
          Analytics and the Meta pixel.
        </li>
      </ul>

      <h2>2. How we use it</h2>
      <ul>
        <li>To respond to your request and connect you with the local business you asked about.</li>
        <li>To send you the messages you consented to receive — see our <a href="/sms">SMS Terms</a>.</li>
        <li>To confirm, remind you about, and change appointments you booked.</li>
        <li>To show you businesses near you rather than across the country.</li>
        <li>To measure which of our ads and pages actually work, and to improve the platform.</li>
        <li>To prevent fraud and abuse, and to comply with the law.</li>
      </ul>

      <h2>3. Text messages and mobile data — no third-party sharing</h2>
      <p className="legal-callout">
        No mobile information will be sold, rented, or shared with third parties or affiliates for
        marketing or promotional purposes. Text messaging originator opt-in data and consent are
        not shared with any third parties, and are excluded from all other information sharing
        described in this policy.
      </p>
      <p>
        When you submit a request, we pass the details of that request to the matched local
        business so they can prepare your estimate and perform the work. That business may contact
        you <b>by phone or email</b>. They do not receive the right to text you under
        HubLinkPro&apos;s consent, and they do not receive permission to add you to their own
        marketing lists. If a business ever wants to text you, they must obtain their own separate
        consent from you directly.
      </p>

      <h2>4. Who else sees your information</h2>
      <ul>
        <li>
          <b>The business you asked about.</b> Your request details, so they can serve you. Scope
          limited as described in section 3.
        </li>
        <li>
          <b>Service providers working for us.</b> Our messaging platform and CRM, our website
          host, our analytics providers, and our payment processor. They may only use your
          information to perform services for us, under contract.
        </li>
        <li>
          <b>When the law requires it.</b> To comply with a lawful request, enforce our terms, or
          protect someone&apos;s safety or rights.
        </li>
        <li>
          <b>In a business transfer.</b> If HubLinkPro is acquired or merged, information may
          transfer — subject to the SMS restriction in section 3, which survives.
        </li>
      </ul>
      <p>
        <b>We do not sell your personal information</b>, and we do not share it for cross-context
        behavioral advertising in the sense those terms are used under state privacy laws.
      </p>

      <h2>5. How long we keep it</h2>
      <p>
        We keep request and contact information for as long as you have an active relationship with
        us and for up to three years afterward. <b>SMS consent records are kept for at least four
        years</b> after the last message we send you, because carrier and TCPA rules require us to
        be able to produce them. Opt-out records are kept indefinitely so that we never text
        someone who told us to stop.
      </p>

      <h2>6. Your choices and rights</h2>
      <ul>
        <li>
          <b>Stop texts.</b> Reply STOP to any message. Details in our <a href="/sms">SMS Terms</a>.
        </li>
        <li>
          <b>Stop emails.</b> Use the unsubscribe link in any marketing email.
        </li>
        <li>
          <b>Access, correct, or delete.</b> Email{" "}
          <a href="mailto:support@hublinkpro.com">support@hublinkpro.com</a> and we will respond
          within 45 days. We may need to verify your identity first.
        </li>
        <li>
          <b>Cookies.</b> Your browser can block or delete cookies. Some features may stop working.
        </li>
      </ul>
      <p>
        Depending on where you live, you may have additional rights under state privacy laws,
        including the right to know what we collect, the right to delete, and the right not to be
        discriminated against for exercising those rights. Use the email above to exercise them.
      </p>

      <h2>7. Security</h2>
      <p>
        We use encryption in transit, access controls, and reputable infrastructure providers. No
        method of transmission or storage is perfectly secure, and we cannot guarantee absolute
        security.
      </p>

      <h2>8. Children</h2>
      <p>
        HubLinkPro is not directed to children under 13, and we do not knowingly collect their
        information. If you believe a child has given us information, email us and we will delete
        it.
      </p>

      <h2>9. Changes to this policy</h2>
      <p>
        We may update this policy. Material changes will be posted here with a new &quot;last
        updated&quot; date. If a change materially affects how we use information you already gave
        us, we will make a reasonable effort to notify you directly.
      </p>
    </LegalLayout>
  );
}
