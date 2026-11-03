import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HubLinkPro — Stop searching. Start discovering.",
  description:
    "Local discovery for Johnson City and Kingsport: food trucks, home pros and more. Founding listings are open.",
  openGraph: {
    title: "HubLinkPro — Your neighborhood's best, all in one place.",
    description:
      "Local businesses and food trucks in Johnson City and Kingsport. Founding listings are open.",
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
