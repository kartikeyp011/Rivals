import { redirect } from "next/navigation";
import Link from "next/link";
import { APP_STORE_URL } from "@/config/app";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "App Store",
  description: "Download Rivals on the Apple App Store.",
};

export default function AppStorePage() {
  // If a valid HTTPS URL is configured, automatically redirect to the App Store.
  if (APP_STORE_URL && APP_STORE_URL.startsWith("https://")) {
    redirect(APP_STORE_URL);
  }

  // Otherwise, display the publishing placeholder.
  return (
    <section style={{ padding: "120px 20px", textAlign: "center", minHeight: "60vh", display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <div className="container">
        <h1 style={{ marginBottom: "16px" }}>Rivals</h1>
        <p style={{ maxWidth: 480, margin: "0 auto 12px", fontSize: "1.25rem", fontWeight: 500 }}>
          Rivals is currently being published on the Apple App Store.
        </p>
        <p style={{ maxWidth: 480, margin: "0 auto 32px", opacity: 0.8 }}>
          Stay tuned! The arena opens soon.
        </p>
        <Link href="/" className="btn btn--accent btn--lg">
          Back to website
        </Link>
      </div>
    </section>
  );
}
