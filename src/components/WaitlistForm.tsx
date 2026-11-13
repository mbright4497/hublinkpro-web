import { joinWaitlist } from "@/app/choose-area/actions";

// "Tell us your area" form. `market` is set when the visitor is on a specific market's page.
export default function WaitlistForm({ back, market, city }: { back: string; market?: string; city?: string }) {
  return (
    <form action={joinWaitlist} className="bookbox">
      <div style={{ position: "absolute", left: "-9999px" }} aria-hidden="true">
        <label>Leave this empty<input name="company_site" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <input type="hidden" name="back" value={back} />
      {market && <input type="hidden" name="market" value={market} />}
      <div className="field">
        <label htmlFor="wl-email">Email</label>
        <input id="wl-email" name="email" type="email" required maxLength={200} autoComplete="email" />
      </div>
      <div className="field">
        <label htmlFor="wl-zip">ZIP code</label>
        <input id="wl-zip" name="zip" inputMode="numeric" pattern="[0-9]{5}" maxLength={5} autoComplete="postal-code" />
      </div>
      {!market && (
        <div className="field">
          <label htmlFor="wl-city">City</label>
          <input id="wl-city" name="city" maxLength={80} defaultValue={city} autoComplete="address-level2" />
        </div>
      )}
      <button className="btn-primary" type="submit">Tell me when you open here</button>
    </form>
  );
}
