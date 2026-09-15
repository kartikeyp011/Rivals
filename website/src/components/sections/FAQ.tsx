"use client";

import { useState } from "react";
import Reveal from "@/components/Reveal";

const FAQS = [
  {
    q: "What is Rivals?",
    a: "Rivals is a daily competitive puzzle app. Every day there's one short Arena with three rounds — Word Duel, Cipher Break, and Number Rush. Your performance across all three combines into one Arena Score you can compare with friends.",
  },
  {
    q: "How long does a daily Arena take?",
    a: "The whole Arena is designed to be completed in under five minutes. It fits into a coffee break.",
  },
  {
    q: "Is Rivals free to play?",
    a: "Yes. The Daily Arena, the friends leaderboard, streaks, and basic access to the Global leaderboard are free. Rivalss+ is an optional subscription that adds extra streak recovery, expanded stats, and an ad-free experience if ads are introduced.",
  },
  {
    q: "What are coins and can I cash them out?",
    a: "Coins are a virtual, in-app currency used for friendly challenges and wagers between players. They have no cash value and cannot be withdrawn or exchanged for real money.",
  },
  {
    q: "How do wagers work?",
    a: "Challenge a friend — or a small group of friends — to complete the same Daily Arena with a stake of virtual coins. Everyone plays the same Arena, and the higher Arena Score takes the pot. Exact rules and payout details are described in the app.",
  },
  {
    q: "What happens if I miss a day?",
    a: "Your active streak breaks. Every new player gets one free streak recovery that can be used once to restore your streak after a missed day. Rivalss+ adds additional recovery benefits.",
  },
  {
    q: "Who can see my score on the Global leaderboard?",
    a: "Only if you opt in. By default you won't appear on the Global leaderboard, and you can opt out at any time from Settings.",
  },
  {
    q: "Which devices are supported?",
    a: "Rivals is being built for iOS and Android, launching on the Apple App Store and the Samsung Galaxy Store.",
  },
  {
    q: "When does Rivals launch?",
    a: "Soon. Store listings are coming — check this page for updates, or reach out at kartikeyp011@gmail.com.",
  },
  {
    q: "Can I play with friends who aren't on my contacts?",
    a: "Yes. Rivals uses an in-app friend system — send a request, they accept, and you can start comparing scores and challenging each other.",
  },
  {
    q: "How do I report a bug or a problem with a puzzle?",
    a: "Email us with a short description and, if possible, a screenshot. Include the date of the Arena and which round was affected.",
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
    q: "How do I delete my account?",
    a: "Email us from the address associated with your account and we'll help you delete it.",
  },
];

import FaqItem from "@/components/ui/FaqItem";

export default function FAQ() {
  return (
    <section className="section" id="faq" aria-labelledby="faq-heading">
      <div className="container">
        <Reveal className="section-head center">
          <span className="eyebrow">FAQ</span>
          <h2 id="faq-heading">Questions, answered.</h2>
        </Reveal>

        <div className="faq">
          {FAQS.map((item, i) => (
            <Reveal key={item.q} delay={i * 30}>
              <FaqItem q={item.q} a={item.a} />
            </Reveal>
          ))}
        </div>

        <Reveal delay={200}>
          <div className="contact-card" style={{ marginTop: 64, marginBottom: 0 }}>
            <div className="contact-card-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
            </div>
            <div className="contact-card-text">
              <h3>Still need help?</h3>
              <p>The fastest way to reach us is by email. We read every message and usually reply within 24 hours.</p>
            </div>
            <a
              href="mailto:kartikeyp011@gmail.com"
              className="btn btn--primary"
            >
              Email Support
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
