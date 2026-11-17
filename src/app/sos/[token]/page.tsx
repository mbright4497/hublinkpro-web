import Link from "next/link";
import SosStatus from "@/components/SosStatus";

export const metadata = { title: "Your emergency request | HubLinkPro", robots: { index: false } };

export default async function SosToken({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <>
      <nav className="nav">
        <Link href="/" className="brand"><span className="logo">H</span><span>HubLink<span className="pro">Pro</span></span></Link>
        <span /><span />
      </nav>
      <div className="page" style={{ maxWidth: 560 }}>
        <h1>Your request</h1>
        <SosStatus token={token} />
      </div>
    </>
  );
}
