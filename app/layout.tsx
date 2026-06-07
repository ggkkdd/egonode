import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";

const SITE_URL = "https://armaged.online";
const TITLE = "Armaged.online — Death by AI Survival Game";
const DESCRIPTION =
  "Face 10 escalating levels of Armageddon. Write a survival plan in 150 characters and let the AI Judge decide if you live or die. A free browser survival game.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s · Armaged.online",
  },
  description: DESCRIPTION,
  applicationName: "Armaged.online",
  authors: [{ name: "Armaged.online" }],
  creator: "Armaged.online",
  publisher: "Armaged.online",
  category: "games",
  keywords: [
    "survival game",
    "AI game",
    "death by AI",
    "armageddon game",
    "apocalypse game",
    "browser game",
    "free online game",
    "AI judge",
    "text survival game",
    "survival plan game",
  ],
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Armaged.online",
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_US",
    images: [
      {
        url: "/og.jpg",
        width: 1408,
        height: 768,
        alt: "Armaged.online — Death by AI survival game",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og.jpg"],
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  manifest: "/manifest.webmanifest",
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  themeColor: "#121212",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

// Structured data for rich results: the site + the game itself.
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "Armaged.online",
      description: DESCRIPTION,
      inLanguage: "en",
    },
    {
      "@type": "VideoGame",
      "@id": `${SITE_URL}/#game`,
      name: "Armaged.online — Death by AI",
      url: SITE_URL,
      description: DESCRIPTION,
      genre: ["Survival", "Strategy", "Casual"],
      gamePlatform: ["Web Browser"],
      applicationCategory: "GameApplication",
      operatingSystem: "Any (web browser)",
      inLanguage: "en",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#121212] text-neutral-200 antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
