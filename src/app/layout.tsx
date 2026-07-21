import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HubLinkPro — Stop searching. Start discovering.",
  description:
    "Browse your neighborhood's best local businesses like you browse Netflix — home pros, restaurants, food trucks and more. Trusted pros. Verified work. Your community.",
  openGraph: {
    title: "HubLinkPro — Your neighborhood's best, all in one place.",
    description:
      "Browse and connect with trusted local pros in one tap. Max 3 per service, per neighborhood. Zero noise.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
