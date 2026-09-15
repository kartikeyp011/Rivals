import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Rivals Privacy Policy. Final legal text will be published here before launch.",
  alternates: { canonical: "/privacy" },
  robots: { index: true, follow: true },
};

/**
 * =========================================================
 * PRIVACY POLICY — PLACEHOLDER
 * =========================================================
 * Replace everything inside <section className="page-body"> below
 * with your final, reviewed Privacy Policy before the app goes live.
 * The App Store and Galaxy Store will link directly to /privacy, so
 * this URL must remain stable.
 * =========================================================
 */

export default function PrivacyPage() {
  return (
    <>
      <div className="page-hero">
        <div className="container">
          <h1>Privacy Policy</h1>
          <p className="lead">How Rivals handles your information.</p>
        </div>
      </div>

      <section className="page-body">
        <div className="container" style={{ maxWidth: 760 }}>
          <div className="placeholder-note">
            <strong>Placeholder.</strong> The final Privacy Policy will be
            published here before Rivals launches on the App Store and Galaxy
            Store. This page is intentionally a placeholder so the URL is
            stable and ready.
          </div>

          <h2>What this policy will cover</h2>
          <ul>
            <li>The types of information the app collects.</li>
            <li>How that information is used and stored.</li>
            <li>How purchases and subscriptions are handled.</li>
            <li>Your rights and how to contact us.</li>
          </ul>

          <h2>Contact</h2>
          <p>
            Questions about privacy in the meantime can be sent to{" "}
            <a href="mailto:kartikeyp011@gmail.com">
              kartikeyp011@gmail.com
            </a>
            .
          </p>
        </div>
      </section>
    </>
  );
}
