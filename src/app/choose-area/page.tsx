import Link from "next/link";
import { getMarkets } from "@/lib/markets";
import { chooseMarket } from "./actions";
import WaitlistForm from "@/components/WaitlistForm";

export const metadata = {
  title: "Choose your area | HubLinkPro",
  description: "Pick your area to see local pros, or tell us where you want HubLinkPro next.",
};

export default async function ChooseArea({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const markets = await getMarkets();
  const open = markets.filter((m) => m.launched);
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
        <h1>Choose your area</h1>
        <p className="lead">See the pros in your part of the country.</p>
        {open.map((m) => (
          <form key={m.slug} action={chooseMarket} style={{ marginBottom: 10 }}>
            <input type="hidden" name="market" value={m.slug} />
            <button className="btn-primary" type="submit" style={{ width: "100%" }}>📍 {m.name} · {m.region_label}</button>
          </form>
        ))}
        <h2 className="dsec">Not in your area yet?</h2>
        <p className="lead" style={{ fontSize: 14 }}>
          We open where neighbors and pros ask for us. Leave your ZIP and we&apos;ll email you when your area opens.
        </p>
        {sp.joined ? (
          <div className="bookbox"><h3>You&apos;re on the list.</h3><p className="lead">We&apos;ll email you when we open in your area.</p></div>
        ) : (
          <>
            {sp.error && <p className="note">Add a valid email, and a 5-digit ZIP if you include one.</p>}
            <WaitlistForm back="/choose-area" />
          </>
        )}
      </div>
    </>
  );
}
