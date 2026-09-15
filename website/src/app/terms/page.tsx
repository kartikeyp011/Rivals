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
          <h2>Terms of Service</h2>
          <p className="lead">The rules for using Rivals.</p>
        </div>
      </div>

      <section className="page-body">
        <div className="container" style={{ maxWidth: 760 }}>
          <p><strong>Last Updated:</strong> September 2026</p>

          <p>
            Welcome to Rivals! These Terms of Service ("Terms") govern your access to and use of the Rivals mobile application ("App") operated by Kartikey Narain Prajapati ("we," "us," or "our"). By accessing or using the App, you agree to be bound by these Terms. If you do not agree to these Terms, do not use the App.
          </p>

          <h2>1. Eligibility and Accounts</h2>
          <p>To use Rivals, you must log in using a valid Google or Apple account. By creating an account, you agree that you are responsible for all activities that occur under your account. We reserve the right to suspend or terminate your account at any time if we believe you have violated these Terms or engaged in cheating, exploiting, or abusive behavior.</p>

          <h2>2. Virtual Coins</h2>
          <p>Rivals utilizes a virtual currency ("Coins") for gameplay mechanics such as challenges and wagers. Please read the following rules carefully:</p>
          <ul>
            <li><strong>No Real-World Value:</strong> Coins are purely virtual. They have no monetary value, cannot be redeemed for cash, and cannot be transferred or sold to others.</li>
            <li><strong>Earning Coins:</strong> Coins can only be earned through gameplay or claimed via manual weekly bonuses. They <strong>cannot</strong> be purchased with real money.</li>
            <li><strong>Account Deletion:</strong> If you delete your account, your Coin balance is permanently forfeited.</li>
          </ul>

          <h2>3. Rivals+ Subscription</h2>
          <p>We offer an optional, auto-renewing subscription called "Rivals+" that provides enhanced features and a weekly bonus of 500 Coins.</p>
          <ul>
            <li><strong>Claiming Bonuses:</strong> The 500 Coin weekly bonus must be claimed manually within the App. Unclaimed bonuses accumulate over time as long as the subscription remains active.</li>
            <li><strong>Billing and Cancellation:</strong> Subscriptions are managed entirely through your Apple App Store or Google Play Store account. You can cancel your subscription at any time through your device settings. If you cancel, you will continue to have access to Rivals+ features until the end of your current billing cycle.</li>
            <li><strong>No Refunds:</strong> Subscription fees are non-refundable, except as required by law or the policies of the respective app stores.</li>
          </ul>

          <h2>4. Acceptable Use and Fair Play</h2>
          <p>Rivals is a competitive multiplayer game. To maintain a fair and enjoyable environment for everyone, you agree <strong>not</strong> to:</p>
          <ul>
            <li>Use bots, cheats, exploits, or third-party software to gain an unfair advantage.</li>
            <li>Harass, threaten, or abuse other players.</li>
            <li>Use offensive, discriminatory, or inappropriate language in your username or profile.</li>
            <li>Attempt to hack, disrupt, or interfere with the App's servers or networks.</li>
          </ul>

          <h2>5. Intellectual Property</h2>
          <p>All content, features, and functionality in the App, including design, text, graphics, and logos, are owned by us and are protected by copyright and intellectual property laws. You may not copy, modify, or distribute any part of the App without our prior written consent.</p>

          <h2>6. Disclaimers and Limitations of Liability</h2>
          <p><strong>The App is provided "as is" and "as available" without any warranties of any kind.</strong> We do not guarantee that the App will be uninterrupted, error-free, or secure.</p>
          <p>To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of the App, including but not limited to loss of data, loss of Coins, or account termination.</p>

          <h2>7. Governing Law and Dispute Resolution</h2>
          <p>These Terms shall be governed by and construed in accordance with the laws of Delhi, India. Any disputes arising out of or in connection with these Terms or the App shall be subject to the exclusive jurisdiction of the courts located in Delhi, India.</p>

          <h2>8. Changes to These Terms</h2>
          <p>We reserve the right to modify these Terms at any time. We will notify you of significant changes by updating the "Last Updated" date and providing notice within the App. Your continued use of the App after such changes constitutes your acceptance of the new Terms.</p>

          <h2>9. Contact Us</h2>
          <p>
            If you have any questions about these Terms, please contact us at:{" "}
            <a href="mailto:kartikeyp011@gmail.com">kartikeyp011@gmail.com</a>.
          </p>
        </div>
      </section>
    </>
  );
}
