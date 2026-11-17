import Link from "next/link";
import SosForm from "@/components/SosForm";

export const metadata = {
  title: "Home emergency? Get a pro now | HubLinkPro",
  description: "Burst pipe, storm damage, no heat. The first on-call local pro to accept your job is on the way.",
};

export default function Sos() {
  return (
    <>
      <nav className="nav">
        <Link href="/" className="brand"><span className="logo">H</span><span>HubLink<span className="pro">Pro</span></span></Link>
        <span />
        <Link href="/" className="signin">← Back</Link>
      </nav>
      <div className="page" style={{ maxWidth: 560 }}>
        <h1>Emergency? We&apos;ll find a pro now.</h1>
        <p className="lead">Tell us what&apos;s wrong. We call the on-call pros near you. The first one to say yes is on the way, and you see who and when.</p>
        <SosForm />
      </div>
    </>
  );
}
