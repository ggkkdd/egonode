import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  metadataBase: new URL("https://armaged.online"),
  title: "Armaged.online — Death by AI",
  description:
    "Face 10 levels of Armageddon. Type your survival plan. Let the AI Judge decide if you live or die.",
  openGraph: {
    title: "Armaged.online — Death by AI",
    description:
      "Face 10 levels of Armageddon. Type your survival plan. Let the AI Judge decide if you live or die.",
    url: "https://armaged.online",
    siteName: "Armaged.online",
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
      <body className="bg-[#121212] text-neutral-200 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
