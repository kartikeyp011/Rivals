import type { Metadata, Viewport } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

/**
 * Canonical URL placeholder.
 * TODO: replace with your real Vercel domain before launch.
 */
const SITE_URL = "https://rivals-website.vercel.app";
const SITE_NAME = "Rivals";
const SITE_DESCRIPTION =
  "Rivals is a daily competitive puzzle app: three quick rounds, one combined Arena Score, and friends to beat. Play in under five minutes, keep your streak, and wager virtual coins.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Rivals — Daily Puzzles & Wagers",
    template: "%s · Rivals",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "daily puzzle game",
    "competitive puzzle app",
    "word puzzle",
    "cipher puzzle",
    "number puzzle",
    "friends leaderboard",
    "puzzle streak",
  ],
  authors: [{ name: "Rivals" }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "Rivals — Daily Puzzles & Wagers",
    description: SITE_DESCRIPTION,
    images: [
      {
        // TODO: replace with a real 1200x630 OG image before launch.
        url: "/og-image-placeholder.svg",
        width: 1200,
        height: 630,
        alt: "Rivals — Daily Puzzles & Wagers",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Rivals — Daily Puzzles & Wagers",
    description: SITE_DESCRIPTION,
    images: ["/og-image-placeholder.svg"],
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#F6EFE3",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">Skip to content</a>
        <Header />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
