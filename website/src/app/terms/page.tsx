import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Rivals Terms of Service. Final legal text will be published here before launch.",
  alternates: { canonical: "/terms" },
  robots: { index: true, follow: true },
};

/**
 * =========================================================
 * TERMS OF SERVICE — PLACEHOLDER
 * =========================================================
 * Replace everything inside <section className="page-body"> below
 * with your final, reviewed Terms of Service before launch.
 * =========================================================
 */

export default function TermsPage() {
  return (
    <>
      <div className="page-hero">
        <div className="container">
          <h1>Terms of Service</h1>
          <p className="lead">The rules for using Rivals.</p>
        </div>
      </div>

      <section className="page-body">
        <div className="container" style={{ maxWidth: 760 }}>
          <div className="placeholder-note">
            <strong>Placeholder.</strong> The final Terms of Service will be
            published here before Rivals launches on the App Store and Galaxy
            Store. This page is intentionally a placeholder so the URL is
            stable and ready.
          </div>

          <h2>What these terms will cover</h2>
          <ul>
            <li>Eligibility to use Rivals.</li>
            <li>Rules for accounts, coins, challenges, and subscriptions.</li>
            <li>Acceptable use and community expectations.</li>
            <li>Disclaimers, limitations, and how disputes are handled.</li>
          </ul>

          <h2>Virtual coins</h2>
          <p>
            Coins in Rivals are a virtual, in-app currency with no cash value.
            They cannot be withdrawn or exchanged for real money.
          </p>

          <h2>Contact</h2>
          <p>
            Questions about these terms can be sent to{" "}
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
