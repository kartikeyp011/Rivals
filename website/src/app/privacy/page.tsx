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
          <h2>Privacy Policy</h2>
          <p className="lead">How Rivals handles your information.</p>
        </div>
      </div>

      <section className="page-body">
        <div className="container" style={{ maxWidth: 760 }}>
          <p><strong>Last Updated:</strong> September 2026</p>

          <p>
            This Privacy Policy explains how Kartikey Narain Prajapati ("we," "us," or "our") collects, uses, and protects your information when you use the Rivals mobile application ("App").
          </p>

          <h2>1. Information We Collect</h2>
          <p>We collect minimal information necessary to operate the App and provide a competitive multiplayer experience:</p>
          <ul>
            <li><strong>Authentication Data:</strong> We use Google and Apple for secure authentication. We do not collect or store your email address or password. We only receive a unique authentication token from these providers to identify your account.</li>
            <li><strong>Profile Information:</strong> When you create an account, you provide a public username and select an avatar. This information is publicly visible to other players on leaderboards and in game summaries. We do not collect real names or display names.</li>
            <li><strong>Gameplay Data:</strong> We store your game history, scores, win streaks, and coin balances to operate the game's core mechanics.</li>
          </ul>

          <h2>2. Information Collected Automatically</h2>
          <p>When you use the App, we automatically collect certain technical information to improve performance and stability:</p>
          <ul>
            <li><strong>Analytics:</strong> We use Firebase Analytics to understand how players interact with the App (e.g., feature usage, session lengths). This data is aggregated and anonymized.</li>
            <li><strong>Crash Reporting:</strong> We use Sentry to collect crash logs and device information (like OS version and device model) when the App encounters an error. This helps us fix bugs quickly.</li>
          </ul>

          <h2>3. Location Data</h2>
          <p>We <strong>do not</strong> collect precise or approximate location data from your device.</p>

          <h2>4. How We Use Your Information</h2>
          <p>We use your information exclusively to:</p>
          <ul>
            <li>Provide, maintain, and improve the App.</li>
            <li>Manage your account and authenticate your identity.</li>
            <li>Process your game results and maintain leaderboards.</li>
            <li>Serve relevant advertisements (see section 5).</li>
            <li>Analyze usage trends and fix technical issues.</li>
          </ul>

          <h2>5. Third-Party Services & Advertising</h2>
          <p>We use third-party services that may collect information used to identify you:</p>
          <ul>
            <li><strong>Google AdMob:</strong> We use AdMob to display advertisements in the App. AdMob may use device identifiers and cookies to serve personalized ads based on your interests. You can opt out of personalized advertising through your device's privacy settings.</li>
            <li><strong>Supabase Cloud:</strong> Our database is hosted on Supabase Cloud, running on AWS servers located in the ap-northeast-1 (Tokyo) region.</li>
          </ul>
          <p>We <strong>do not</strong> use Large Language Models (LLMs) to process your data.</p>

          <h2>6. Data Storage and Security</h2>
          <p>Your data is securely stored on our servers hosted by Supabase Cloud in Tokyo, Japan. We implement reasonable security measures to protect your information from unauthorized access, loss, or misuse.</p>

          <h2>7. Account Deletion and Data Retention</h2>
          <p>You can request to delete your account at any time through the App's settings menu. <strong>When you delete your account, all associated user data—including your username, game history, and coin balance—is permanently deleted from our servers.</strong> We do not retain residual copies of your personal data after deletion.</p>

          <h2>8. Children's Privacy</h2>
          <p>The App is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that we have collected such information, we will take steps to delete it immediately.</p>

          <h2>9. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. We will notify you of any changes by updating the "Last Updated" date at the top of this policy and, if the changes are significant, by providing a prominent notice within the App.</p>

          <h2>10. Contact Us</h2>
          <p>
            If you have any questions or concerns about this Privacy Policy, please contact us at:{" "}
            <a href="mailto:kartikeyp011@gmail.com">kartikeyp011@gmail.com</a>.
          </p>
        </div>
      </section>
    </>
  );
}
