import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Egonode",
  description: "A minimalist node-based narrative experience.",
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
