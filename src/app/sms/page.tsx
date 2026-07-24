import type { Metadata } from "next";
import LegalLayout from "@/components/LegalLayout";

export const metadata: Metadata = {
  title: "SMS Terms & Conditions · HubLinkPro",
  description:
    "HubLinkPro SMS messaging terms — program description, message frequency, rates, and how to opt out.",
};

export default function SmsTerms() {
  return (
    <LegalLayout title="SMS Terms &amp; Conditions" updated="July 24, 2026">
      <p className="legal-callout">
        <b>Short version:</b> we only text you if you asked us to. Message frequency varies.
        Message and data rates may apply. Reply <b>STOP</b> at any time to stop. Reply{" "}
        <b>HELP</b> for help. We never sell or share your phone number or your consent to be
        texted with anyone else for their marketing.
      </p>

      <h2>1. Program description</h2>
      <p>
        HubLinkPro operates SMS messaging programs for itself and on behalf of the local
        businesses listed on our platform. Messages may be co-branded with the business you
        requested and may arrive from that business&apos;s published phone number. Depending on
        which form you filled out, you may receive:
      </p>
      <ul>
        <li>
          <b>Quote &amp; service replies</b> — a response to a request you submitted for an
          estimate, quote, or booking, including follow-up questions needed to schedule the work.
        </li>
        <li>
          <b>Appointment messages</b> — confirmations, reminders, and changes for an appointment
          you booked.
        </li>
        <li>
          <b>Account &amp; listing messages</b> — if you are a business owner, messages about your
          HubLinkPro listing, leads, and account.
        </li>
      </ul>
      <p>
        These are conversational and transactional messages tied to something you asked for. We do
        not add you to unrelated marketing blasts because you requested a quote.
      </p>

      <h2>2. How you opt in</h2>
      <p>
        You opt in by checking the SMS consent box on a HubLinkPro form and submitting it, or by
        texting us first. The consent box is never pre-checked — you have to check it yourself. We
        record the exact wording you agreed to, along with the date and time, and we keep that
        record for as long as we message you plus at least four years afterward.
      </p>
      <p>
        <b>Consent to receive text messages is not a condition of purchase</b> and is not required
        to use HubLinkPro. You can submit a request and ask us to reach you by phone or email
        instead.
      </p>

      <h2>3. Message frequency</h2>
      <p>
        Message frequency varies based on your activity. A typical quote request results in
        roughly 2–10 messages while we are helping you. Appointment reminders are generally 1–3
        messages per appointment.
      </p>

      <h2>4. Cost</h2>
      <p>
        <b>Message and data rates may apply.</b> HubLinkPro does not charge you for text messages,
        but your mobile carrier may, depending on your plan. Contact your carrier for details.
      </p>

      <h2>5. How to opt out</h2>
      <p>
        Reply <b>STOP</b> to any message from us at any time. You will receive one final message
        confirming that you have been unsubscribed, and we will not text you again from that
        program unless you opt back in. You can also email{" "}
        <a href="mailto:support@hublinkpro.com">support@hublinkpro.com</a> or simply tell us in the
        conversation and we will remove you manually.
      </p>
      <p>
        To rejoin, reply <b>START</b> or submit a new request with the consent box checked.
      </p>

      <h2>6. How to get help</h2>
      <p>
        Reply <b>HELP</b> to any message for support information, or email{" "}
        <a href="mailto:support@hublinkpro.com">support@hublinkpro.com</a>.
      </p>

      <h2>7. We do not share your number or your consent</h2>
      <p className="legal-callout">
        HubLinkPro does not sell, rent, or share your mobile phone number, your SMS consent, or
        your opt-in data with third parties, affiliates, or partners for their own marketing
        purposes.
      </p>
      <p>
        <b>Who the messages come from.</b> HubLinkPro operates the messaging for the local
        business you requested. A message about your request may therefore be co-branded — it may
        arrive from that business&apos;s published number and name them directly — but it is sent
        by HubLinkPro on their behalf, under HubLinkPro&apos;s messaging registration and these
        terms. Your consent covers <b>HubLinkPro and the specific business you asked about, for
        the request you submitted</b>. It does not extend to any other company, and it is not
        transferable.
      </p>
      <p>
        <b>What that means in practice.</b> We pass your request to the matched local business so
        they can prepare and deliver your estimate, and they may also contact you by phone or
        email. We do not hand your number to other companies so they can run their own text
        campaigns, and we do not add you to anyone else&apos;s marketing list. If that business
        wants to message you about anything beyond the request you made, they need their own
        consent from you directly.
      </p>
      <p>
        The only parties who ever touch your number on our side are the service providers who
        operate our messaging and CRM infrastructure on our behalf, under contract, and only so
        that we can deliver the messages you asked for.
      </p>

      <h2>8. Supported carriers and disclaimers</h2>
      <p>
        Carriers are not liable for delayed or undelivered messages. Message delivery is subject
        to effective transmission by your wireless carrier and is not guaranteed. Service may not
        be available on all carriers.
      </p>

      <h2>9. Privacy</h2>
      <p>
        Our handling of your information is described in our <a href="/privacy">Privacy Policy</a>.
        Your use of HubLinkPro is governed by our <a href="/terms">Terms of Service</a>.
      </p>

      <h2>10. Changes</h2>
      <p>
        We may update these SMS Terms. Material changes will be posted here with a new
        &quot;last updated&quot; date. Continuing to participate after a change means you accept
        the updated terms.
      </p>
    </LegalLayout>
  );
}
