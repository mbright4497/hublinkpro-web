import type { Metadata } from "next";
import "./globals.css";
import { SITE_URL, jsonLd } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // "./" resolves to each page's own path, so query strings like ?day= never create duplicates.
  alternates: { canonical: "./" },
  title: "HubLinkPro — Stop searching. Start discovering.",
  description:
    "Local discovery for Johnson City and Kingsport: food trucks, home pros and more. Founding listings are open.",
  openGraph: {
    title: "HubLinkPro — Your neighborhood's best, all in one place.",
    description:
      "Local businesses and food trucks in Johnson City and Kingsport. Founding listings are open.",
    type: "website",
    url: "./",
    siteName: "HubLinkPro",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLd({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": `${SITE_URL}/#org`,
                  name: "HubLinkPro",
                  url: SITE_URL,
                  email: "support@hublinkpro.com",
                  sameAs: ["https://www.facebook.com/TriCitiesHubLinkPro"],
                },
                {
                  "@type": "WebSite",
                  "@id": `${SITE_URL}/#site`,
                  url: SITE_URL,
                  name: "HubLinkPro",
                  publisher: { "@id": `${SITE_URL}/#org` },
                },
              ],
            }),
          }}
        />
        {children}
      </body>
    </html>
  );
}
