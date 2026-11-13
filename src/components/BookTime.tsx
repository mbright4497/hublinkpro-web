import { bookSlot } from "@/app/channel/[slug]/actions";
import { fmtDayLabel, fmtTime, fmtWhen, tzLabel } from "@/lib/booking";

type Props = {
  slug: string;
  name: string;
  tz: string;
  services: string[];
  // Open slot start times (ISO), grouped by local day key, in date order.
  days: { key: string; slots: string[] }[];
  selectedDay: string | null;
  selectedSlot: string | null;
  booked: string | null; // ISO of a just-booked slot
  emailed: boolean; // a confirmation email really went out
  error: string | null;
};

const ERRORS: Record<string, string> = {
  taken: "Someone just took that time. Pick another one.",
  slot: "Pick a time first.",
  info: "Add your name and a phone number (and a valid email if you give one).",
  limit: "You already have several upcoming bookings with this business. Call them to change one.",
  error: "Something went wrong. Please try again.",
};

export default function BookTime({ slug, name, tz, services, days, selectedDay, selectedSlot, booked, emailed, error }: Props) {
  if (booked) {
    return (
      <section id="book" className="bookbox">
        <h2 style={{ fontSize: 20, marginTop: 0 }}>You&apos;re booked</h2>
        <p className="note ok">
          {name} has you down for {fmtWhen(booked, tz)} ({tzLabel(tz)} time).{emailed ? " A confirmation is on its way to your email." : ""}
        </p>
      </section>
    );
  }

  const day = days.find((d) => d.key === selectedDay) ?? days[0] ?? null;

  return (
    <section id="book" className="bookbox">
      <h2 style={{ fontSize: 20, marginTop: 0 }}>Book a time</h2>
      {days.length === 0 ? (
        <p style={{ color: "var(--color-mist)" }}>No open times right now. Send a request below and they&apos;ll get back to you.</p>
      ) : (
        <>
          <p style={{ color: "var(--color-mist)", marginTop: 0 }}>Times shown in {tzLabel(tz)} time.</p>
          <div className="chips" role="list" aria-label="Pick a day">
            {days.slice(0, 14).map((d) => {
              const l = fmtDayLabel(d.key);
              const on = day?.key === d.key;
              return (
                <a
                  key={d.key}
                  role="listitem"
                  href={`/channel/${slug}?day=${d.key}#book`}
                  aria-current={on ? "true" : undefined}
                  style={on ? { background: "var(--color-accent, #fb923c)", color: "#1a1205", fontWeight: 700 } : undefined}
                >
                  {l.dow} {l.md}
                </a>
              );
            })}
          </div>

          {day && (
            <form action={bookSlot} style={{ marginTop: 16 }}>
              {error && <p className="note">{ERRORS[error] ?? ERRORS.error}</p>}
              <input type="hidden" name="slug" value={slug} />
              <input type="hidden" name="day" value={day.key} />
              <div style={{ position: "absolute", left: "-9999px" }} aria-hidden="true">
                <label>Leave this empty<input name="company_site" tabIndex={-1} autoComplete="off" /></label>
              </div>
              <fieldset style={{ border: 0, padding: 0, margin: "0 0 14px" }}>
                <legend style={{ fontWeight: 600, marginBottom: 8 }}>Open times</legend>
                <div className="chips">
                  {day.slots.map((s) => (
                    <label key={s} style={{ cursor: "pointer" }}>
                      <input type="radio" name="slot" value={s} required defaultChecked={selectedSlot === s} style={{ marginRight: 6 }} />
                      {fmtTime(s, tz)}
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="field"><label htmlFor="bt-name">Your name</label><input id="bt-name" name="name" required maxLength={120} autoComplete="name" /></div>
              <div className="field"><label htmlFor="bt-phone">Phone</label><input id="bt-phone" name="phone" type="tel" required maxLength={30} autoComplete="tel" /></div>
              <div className="field"><label htmlFor="bt-email">Email (for your confirmation)</label><input id="bt-email" name="email" type="email" maxLength={200} autoComplete="email" /></div>
              {services.length > 0 && (
                <div className="field">
                  <label htmlFor="bt-service">What do you need?</label>
                  <select id="bt-service" name="service" defaultValue="">
                    <option value="">Choose a service</option>
                    {services.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}
              <div className="field"><label htmlFor="bt-msg">Anything they should know? (optional)</label><textarea id="bt-msg" name="message" rows={3} maxLength={2000} /></div>
              <label className="consent">
                <input type="checkbox" name="sms_consent" />
                <span>I agree to receive text messages about this request from the business and from HubLinkPro on its behalf. Message frequency varies. Message and data rates may apply. Reply STOP to opt out, HELP for help. Consent is not a condition of purchase. <a href="/sms">SMS terms</a> · <a href="/privacy">Privacy</a></span>
              </label>
              <button className="btn-primary" type="submit">Book this time</button>
            </form>
          )}
        </>
      )}
    </section>
  );
}
