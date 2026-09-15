import type { Metadata } from "next";
import Link from "next/link";
import GuideSidebar from "@/components/ui/GuideSidebar";

export const metadata: Metadata = {
  title: "How to Play — Rivals Guide",
  description:
    "A complete walkthrough guide for Rivals. Learn how to play the Daily Arena, build your streak, challenge friends, and use Rivals+.",
  alternates: { canonical: "/guide" },
};

interface Step {
  num: string;
  title: string;
  body: string;
  tip?: string;
}

const SECTIONS: { id: string; label: string; icon: string; intro: string; steps: Step[] }[] = [
  {
    id: "arena",
    label: "The Daily Arena",
    icon: "⚡",
    intro:
      "Every day at midnight, a new Arena opens. It consists of three back-to-back rounds. You play all three, and your combined performance generates your Arena Score for the day. Simple.",
    steps: [
      {
        num: "01",
        title: "Open the app and tap \"Play Today\"",
        body: "The Arena is available every day. Tap the big Play button on the home screen to launch today's Arena. You can play anytime during the day — the Arena doesn't close until the next midnight reset.",
        tip: "Try to play before midnight — the reset is global, not timezone-based.",
      },
      {
        num: "02",
        title: "Complete all three rounds",
        body: "Word Duel, Cipher Break, and Number Rush play back-to-back with no break. Each round is timed and scored independently. Don't skip — all three scores combine into your single Arena Score.",
      },
      {
        num: "03",
        title: "See your Arena Score",
        body: "After round three, your results screen shows each round's score and your combined Arena Score. This is the number your friends will see on the leaderboard.",
        tip: "The Arena Score is final — you can't replay the day's Arena to get a higher score.",
      },
    ],
  },
  {
    id: "rounds",
    label: "The Three Rounds",
    icon: "🎮",
    intro:
      "Each round tests a different skill. Here's exactly what to expect so you can prepare.",
    steps: [
      {
        num: "01",
        title: "Word Duel",
        body: "You are given a prompt and must form the best word or phrase you can within the time limit. Your answer is scored on accuracy, creativity, and speed. The faster you answer correctly, the higher the bonus.",
      },
      {
        num: "02",
        title: "Cipher Break",
        body: "A short encoded message appears. Decode it using the hint provided. Each correct answer and each second remaining on the clock adds to your score. Partial credit is given for partially decoded messages.",
        tip: "Read the full cipher before guessing — patterns emerge faster when you have the full picture.",
      },
      {
        num: "03",
        title: "Number Rush",
        body: "A rapid-fire sequence of arithmetic or number pattern problems. Answer as many as you can before time runs out. Correct answers add points; wrong answers deduct a small penalty. Speed and accuracy both matter.",
      },
    ],
  },
  {
    id: "friends",
    label: "Friends & Leaderboard",
    icon: "🏆",
    intro:
      "Playing alone is fine. Playing against friends who can see your score is better. Here's how the social layer works.",
    steps: [
      {
        num: "01",
        title: "Add friends inside the app",
        body: "Go to the Friends tab and tap \"Add Friend\". Search by username or share your personal invite link. Your friend receives a request — once they accept, you're connected.",
      },
      {
        num: "02",
        title: "The Daily Leaderboard",
        body: "After completing today's Arena, you'll see a leaderboard showing your score next to your friends' scores for the same day. Scores update in real-time as friends finish their Arenas throughout the day.",
        tip: "Scores are hidden until you have completed the Arena yourself — no peeking first!",
      },
      {
        num: "03",
        title: "The All-Time Leaderboard",
        body: "This shows cumulative Arena Scores over all time. It's the long game — a slow, reliable measure of who's been the most consistently good, not just who had one great day.",
      },
      {
        num: "04",
        title: "Global Leaderboard (opt-in)",
        body: "By default, you only appear on your friends' leaderboards. To compete with the wider Rivals community, go to Settings and toggle the Global Leaderboard on. You can opt back out at any time.",
      },
    ],
  },
  {
    id: "wagers",
    label: "Challenges & Wagers",
    icon: "🪙",
    intro:
      "Coins are Rivals' virtual currency. They have no cash value and can't be withdrawn — they exist purely to make friendly competition a little more interesting.",
    steps: [
      {
        num: "01",
        title: "How to send a challenge",
        body: "On any friend's profile, tap \"Challenge\". Set a coin wager amount (within your available balance) and confirm. They'll get a notification and have until midnight to accept and complete the Arena.",
        tip: "Group challenges (up to 5 players) are also available. Highest Arena Score takes the entire pot.",
      },
      {
        num: "02",
        title: "How outcomes work",
        body: "Challenges are resolved using your Arena Score for the same day's Arena. If you've already played today's Arena before sending the challenge, your existing score counts. There's no re-playing.",
      },
      {
        num: "03",
        title: "Earning coins",
        body: "You earn a small coin bonus every day you complete the Arena, and a larger bonus for maintaining a long streak. Challenge winnings are paid out immediately after the deadline passes.",
      },
    ],
  },
  {
    id: "streaks",
    label: "Streaks & Rivals+",
    icon: "🔥",
    intro:
      "A streak counts the number of consecutive days you've completed the Arena. It's the single most motivating number in the app.",
    steps: [
      {
        num: "01",
        title: "Building your streak",
        body: "Complete the Daily Arena every day. Your streak counter increments at midnight when the new Arena opens. Miss a single day and the count resets to zero.",
      },
      {
        num: "02",
        title: "Free streak recovery",
        body: "Every new player gets one free streak recovery. If you miss a day, you can spend it to restore your streak as if you hadn't missed. It's a one-time safety net — use it wisely.",
        tip: "Your recovery is automatically applied if your streak would break, so you don't need to manually trigger it.",
      },
      {
        num: "03",
        title: "Rivals+ subscription",
        body: "Rivals+ is an optional paid subscription that gives you additional streak recovery slots, expanded stats history, and an ad-free experience if ads are ever introduced.",
      },
      {
        num: "04",
        title: "Managing Rivals+",
        body: "Subscriptions are managed by the App Store (iOS) or the Galaxy Store (Android). To cancel, go to your store's subscription settings. You'll keep Rivals+ benefits until the end of the current billing period.",
      },
    ],
  },
];

export default function GuidePage() {
  return (
    <div className="guide-page">
      {/* Hero */}
      <div className="guide-hero">
        <div className="container">
          <h1>How to Play Rivals</h1>
          <p className="guide-hero-sub">
            Everything you need to know to play, compete, and win. From your
            first Arena to your 100-day streak.
          </p>
          <div className="guide-hero-meta">
            <span>5 sections</span>
            <span className="guide-hero-sep">·</span>
            <span>~4 min read</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="guide-body">
        <div className="container">
          <div className="guide-layout">
            {/* Sticky Sidebar */}
            <aside className="guide-sidebar">
              <GuideSidebar />
            </aside>

            {/* Main Content */}
            <main className="guide-content">
              {SECTIONS.map((section, si) => (
                <section key={section.id} id={section.id} className="guide-section">
                  <div className="guide-section-header">
                    <div className="guide-section-icon">{section.icon}</div>
                    <div>
                      <div className="guide-section-num">Section 0{si + 1}</div>
                      <h2>{section.label}</h2>
                    </div>
                  </div>

                  <p className="guide-section-intro">{section.intro}</p>

                  <div className="guide-steps">
                    {section.steps.map((step) => (
                      <div key={step.num} className="guide-step">
                        <div className="guide-step-num">{step.num}</div>
                        <div className="guide-step-body">
                          <h3>{step.title}</h3>
                          <p>{step.body}</p>
                          {step.tip && (
                            <div className="guide-tip">
                              <span className="guide-tip-icon">💡</span>
                              <span>{step.tip}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}

              {/* Footer CTA */}
              <div className="guide-footer-cta">
                <h2>You&apos;re ready to play.</h2>
                <p>
                  Download Rivals and start your first Arena today. Your streak
                  starts at zero — let&apos;s see how far you can take it.
                </p>
                <div className="guide-footer-cta-actions">
                  <Link href="/#download" className="btn btn--accent btn--lg">
                    Download Rivals
                  </Link>
                  <Link href="/#faq" className="btn btn--ghost btn--lg">
                    More questions →
                  </Link>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
