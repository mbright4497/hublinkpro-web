import type { Metadata } from "next";
import LegalLayout from "@/components/LegalLayout";

export const metadata: Metadata = {
  title: "Terms of Service · HubLinkPro",
  description:
    "The terms that govern your use of HubLinkPro — for homeowners and for listed businesses.",
};

export default function Terms() {
  return (
    <LegalLayout title="Terms of Service" updated="July 24, 2026">
      <p>
        These terms are the agreement between you and HubLinkPro, a brand of Bright LLC
        (&quot;HubLinkPro,&quot; &quot;we,&quot; &quot;us&quot;), covering hublinkpro.com, our
        landing pages including those at go.hublinkpro.com, and any service we provide through
        them. By using HubLinkPro you accept these terms. If you do not accept them, do not use
        the platform.
      </p>

      <h2>1. What HubLinkPro is — and is not</h2>
      <p>
        HubLinkPro is a local discovery platform. We help neighbors find local businesses, and we
        help those businesses be found. <b>We are not a party to any agreement between you and a
        business you find here.</b> We do not perform the work, set the price, guarantee the
        outcome, or supervise the job.
      </p>
      <p>
        We make an effort to verify the businesses we list, but verification is not a warranty. You
        are responsible for confirming that any business you hire is properly licensed, insured,
        and right for your job.
      </p>

      <h2>2. Using the platform as a neighbor</h2>
      <ul>
        <li>Give us accurate information — especially the phone number and address where you want to be reached.</li>
        <li>Only submit a phone number you actually control. Do not enter someone else&apos;s number.</li>
        <li>Do not use HubLinkPro to harass a business, submit fake requests, or scrape our listings.</li>
        <li>You must be at least 18 to submit a service request.</li>
      </ul>
      <p>
        Submitting a request is free. Consent to receive text messages is never required to submit
        a request or to use HubLinkPro — see our <a href="/sms">SMS Terms</a>.
      </p>

      <h2>3. Listing a business</h2>
      <ul>
        <li>
          You confirm you are authorized to represent the business you list, and that your
          licensing, insurance, and service-area claims are true and current.
        </li>
        <li>
          Content you upload — photos, descriptions, logos — must be yours to use. You grant us a
          license to display it on HubLinkPro and in marketing for the platform.
        </li>
        <li>
          Reviews and proof-of-work must be genuine. Fabricated reviews are grounds for immediate
          removal without refund.
        </li>
        <li>
          Leads we route to you are for your own use in serving that customer. You may not resell
          them, and you may not text a customer without obtaining your own consent from that
          customer directly.
        </li>
      </ul>

      <h2>4. Paid listings and exclusivity</h2>
      <p>
        Paid tiers are billed in advance on a recurring basis until cancelled. Exclusive
        placements are sold per service category, per ZIP code, and are held only while the
        subscription is current. If a subscription lapses, the slot returns to inventory and may be
        sold to another business.
      </p>
      <p>
        You can cancel at any time; cancellation stops the next renewal. Fees already paid are
        non-refundable except where required by law. We may change pricing with at least 30 days
        notice before it applies to your next renewal.
      </p>

      <h2>5. Messaging</h2>
      <p>
        Our text messaging program, including how to opt in, how to opt out, message frequency,
        and rates, is described in our <a href="/sms">SMS Terms</a>, which are part of these
        terms. How we handle your information is described in our{" "}
        <a href="/privacy">Privacy Policy</a>.
      </p>

      <h2>6. Intellectual property</h2>
      <p>
        HubLinkPro, our logo, and the design and content of the platform are ours. You may not
        copy, scrape, resell, or build a competing directory from our listings.
      </p>

      <h2>7. Disclaimers</h2>
      <p>
        The platform is provided &quot;as is&quot; and &quot;as available,&quot; without warranties
        of any kind, express or implied, including merchantability, fitness for a particular
        purpose, and non-infringement. We do not warrant that listings are error-free or that the
        platform will be uninterrupted.
      </p>

      <h2>8. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, HubLinkPro is not liable for indirect, incidental,
        special, consequential, or punitive damages, or for any dispute, damage, injury, or loss
        arising out of work performed by a business you found through the platform. Our total
        liability for any claim relating to the platform will not exceed the greater of the amount
        you paid us in the twelve months before the claim, or one hundred dollars.
      </p>

      <h2>9. Indemnity</h2>
      <p>
        You agree to indemnify and hold HubLinkPro harmless from claims arising out of your use of
        the platform, your content, your violation of these terms, or — if you are a listed
        business — the work you perform for a customer.
      </p>

      <h2>10. Suspension and termination</h2>
      <p>
        We may suspend or remove any account or listing that violates these terms, harms other
        users, or creates legal or carrier-compliance risk for the platform. You may stop using
        HubLinkPro at any time.
      </p>

      <h2>11. Governing law</h2>
      <p>
        These terms are governed by the laws of the State of Tennessee, without regard to conflict
        of law rules. Disputes will be brought in the state or federal courts located in
        Washington County, Tennessee, and you consent to that jurisdiction.
      </p>

      <h2>12. Changes</h2>
      <p>
        We may update these terms. Material changes will be posted here with a new &quot;last
        updated&quot; date. Continuing to use HubLinkPro after a change means you accept it.
      </p>
    </LegalLayout>
  );
}
