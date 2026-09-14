import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support",
  description:
    "Get help with Rivals — account, gameplay, streaks, coins, and subscriptions.",
  alternates: { canonical: "/support" },
};

const SUPPORT_FAQS = [
  {
    q: "How do I report a bug or a problem with a puzzle?",
    a: "Email us with a short description and, if possible, a screenshot. Include the date of the Arena and which round (Word Duel, Cipher Break, or Number Rush) was affected.",
  },
  {
    q: "My streak was lost — can it be restored?",
    a: "Every new player has one free streak recovery. If you've already used it, Rivalss+ adds additional recovery benefits.",
  },
  {
    q: "I think a wager resolved incorrectly.",
    a: "Wager outcomes are based on validated Arena Scores. If something looks wrong, email us with the challenge details and we'll take a look.",
  },
  {
    q: "How do I cancel my Rivalss+ subscription?",
    a: "Subscriptions are managed by the App Store or the Galaxy Store. Cancel from your store account's subscriptions page. You'll keep access until the end of the current billing period.",
  },
  {
    q: "How do I opt out of the Global leaderboard?",
    a: "In the app, open Settings and toggle the Global leaderboard visibility setting off.",
  },
  {
    q: "How do I delete my account?",
    a: "Email us from the address associated with your account and we'll help you delete it.",
  },
];

export default function SupportPage() {
  return (
    <>
      <div className="page-hero">
        <div className="container">
          <h1>Support</h1>
          <p className="lead">
            Need a hand? Most questions are answered below. If not, email us.
          </p>
        </div>
      </div>

      <section className="page-body">
        <div className="container" style={{ maxWidth: 820 }}>
          <h2>Contact</h2>
          <p>
            The fastest way to reach us is by email. We read every message.
          </p>
          <p>
            <a
              href="mailto:kartikeyp011@gmail.com"
              className="btn btn--warm"
              style={{ marginTop: 8 }}
            >
              Email kartikeyp011@gmail.com
            </a>
          </p>

          <h2 style={{ marginTop: 48 }}>Common questions</h2>
          <div className="faq" style={{ margin: 0 }}>
            {SUPPORT_FAQS.map((item) => (
              <details key={item.q}>
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
