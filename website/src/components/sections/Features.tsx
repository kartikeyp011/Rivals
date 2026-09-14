import Reveal from "@/components/Reveal";

const FEATURES = [
  {
    title: "Daily Arena",
    body:
      "One new Arena every day. Three short rounds, combined into a single score. No long sessions, no grinding.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="3" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
  },
  {
    title: "Three puzzle types",
    body:
      "Word Duel, Cipher Break, and Number Rush. Each round plays differently, so every Arena tests a different muscle.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4" />
      </svg>
    ),
  },
  {
    title: "Friends leaderboard",
    body:
      "Add friends, then compare Daily and All-Time rankings. The score that counts is the one you earned — not a vanity number.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    title: "Wager virtual coins",
    body:
      "Challenge a friend (or a few) with a small stake of virtual coins. The higher Arena Score takes the pot. Coins are for fun only.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v10M9.5 9.5h4a1.5 1.5 0 1 1 0 3h-3a1.5 1.5 0 1 0 0 3h4" />
      </svg>
    ),
  },
  {
    title: "Streaks that stick",
    body:
      "Complete the Arena daily to build your streak. Every new player gets one free streak recovery to spend when life gets in the way.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3s6 4 6 9a6 6 0 0 1-12 0c0-5 6-9 6-9z" />
      </svg>
    ),
  },
  {
    title: "Global leaderboard (optional)",
    body:
      "If you want a bigger pond, opt in to the Global leaderboard. Don't want to appear publicly? Stay opted out — it's your call.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
      </svg>
    ),
  },
];

export default function Features() {
  return (
    <section className="section" id="features" aria-labelledby="features-heading">
      <div className="container">
        <Reveal className="section-head">
          <span className="eyebrow">What you get</span>
          <h2 id="features-heading">Built around a five-minute habit</h2>
          <p className="lead">
            Everything in Rivals is designed to fit into a coffee break — and
            still give you a real reason to come back tomorrow.
          </p>
        </Reveal>

        <div className="grid-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 60} className="card">
              <div className="card-icon" aria-hidden="true">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
