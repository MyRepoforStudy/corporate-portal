import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import { SessionProvider } from "@/components/providers/session-provider";
import { getTheme } from "@/lib/theme";
import "./globals.css";

// Cyrillic covers ru/kk; Korean (ko) has no glyphs in this typeface and
// falls back to the system font automatically via the CSS font stack below.
const plexSans = IBM_Plex_Sans({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BNK Corporate Portal",
  description: "Внутренний корпоративный портал BNK Commercial Bank",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = getTheme();

  return (
    <html lang="ru" className={`${plexSans.variable} ${theme === "dark" ? "dark" : ""}`}>
      <body className="bg-white text-gray-900 antialiased">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
