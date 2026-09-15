import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Support",
  description: "Get help with Rivals, read our guides, or contact support.",
  alternates: { canonical: "/support" },
};

export default function SupportPage() {
  return (
    <>
      <div className="page-hero">
        <div className="container">
          <h2>Support</h2>
          <p className="lead">How can we help you today?</p>
        </div>
      </div>

      <section className="page-body" style={{ minHeight: "50vh" }}>
        <div className="container" style={{ maxWidth: 760 }}>
          <div style={{ display: "grid", gap: 32, gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
            
            {/* Guide Card */}
            <div style={{ padding: 32, border: "1px solid var(--line)", borderRadius: "var(--radius-lg)", background: "#fff" }}>
              <div style={{ fontSize: "2rem", marginBottom: 16 }}>📖</div>
              <h3 style={{ marginBottom: 8 }}>Player Guide</h3>
              <p style={{ fontSize: "0.95rem" }}>Learn how to play the Daily Arena, earn coins, and build your streak.</p>
              <Link href="/guide" className="btn btn--ghost" style={{ marginTop: 16 }}>
                Read the Guide
              </Link>
            </div>

            {/* FAQ Card */}
            <div style={{ padding: 32, border: "1px solid var(--line)", borderRadius: "var(--radius-lg)", background: "#fff" }}>
              <div style={{ fontSize: "2rem", marginBottom: 16 }}>❓</div>
              <h3 style={{ marginBottom: 8 }}>FAQ</h3>
              <p style={{ fontSize: "0.95rem" }}>Quick answers to common questions about accounts, Rivals+, and more.</p>
              <Link href="/#faq" className="btn btn--ghost" style={{ marginTop: 16 }}>
                View FAQ
              </Link>
            </div>

            {/* Contact Card */}
            <div style={{ padding: 32, border: "1px solid var(--line)", borderRadius: "var(--radius-lg)", background: "#f8f8fb", gridColumn: "1 / -1", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
              <div>
                <h3 style={{ marginBottom: 8 }}>Still need help?</h3>
                <p style={{ fontSize: "0.95rem", margin: 0 }}>Send us an email and we'll get back to you as soon as possible.</p>
              </div>
              <a href="mailto:kartikeyp011@gmail.com" className="btn btn--primary">
                kartikeyp011@gmail.com
              </a>
            </div>

          </div>
        </div>
      </section>
    </>
  );
}
