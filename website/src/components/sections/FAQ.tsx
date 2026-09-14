import Reveal from "@/components/Reveal";

const FAQS = [
  {
    q: "What is Rivals?",
    a: "Rivals is a daily competitive puzzle app. Every day there's one short Arena with three rounds — Word Duel, Cipher Break, and Number Rush. Your performance across all three combines into a single Arena Score you can compare with friends.",
  },
  {
    q: "How long does a daily Arena take?",
    a: "The whole Arena is designed to be completed in under five minutes. It's built to fit into a coffee break.",
  },
  {
    q: "Is Rivals free to play?",
    a: "Yes. The Daily Arena, the friends leaderboard, streaks, and basic access to the Global leaderboard are all free. An optional subscription, Rivalss+, adds extra streak recovery, expanded stats, and an ad-free experience if ads are introduced.",
  },
  {
    q: "What are coins and can I cash them out?",
    a: "Coins are a virtual, in-app currency used for friendly challenges and wagers between players. They have no cash value and cannot be withdrawn or exchanged for real money.",
  },
  {
    q: "How do wagers work?",
    a: "You can challenge a friend — or a small group of friends — to complete the same Daily Arena with a stake of virtual coins. Everyone plays the same Arena, and the higher validated Arena Score takes the pot. Exact rules and payout details are described in the app.",
  },
  {
    q: "What happens if I miss a day?",
    a: "Your active streak breaks. Every new player gets one free streak recovery, which can be used once to restore your streak after a missed day. Rivalss+ adds additional recovery benefits.",
  },
  {
    q: "Who can see my score on the Global leaderboard?",
    a: "Only if you opt in. By default you won't appear on the Global leaderboard, and you can opt out at any time from Settings.",
  },
  {
    q: "What puzzle types are in each Arena?",
    a: "Three: Word Duel (a word puzzle), Cipher Break (a cipher to crack, in Easy, Medium, or Hard), and Number Rush (a number puzzle). The order is always the same, so your routine stays consistent day to day.",
  },
  {
    q: "Which devices are supported?",
    a: "Rivals is being built for iOS and Android, launching on the Apple App Store and the Samsung Galaxy Store.",
  },
  {
    q: "When does Rivals launch?",
    a: "Soon. Store listings are coming — check this page for updates, or reach out at kartikeyp011@gmail.com.",
  },
];

export default function FAQ() {
  return (
    <section className="section" id="faq" aria-labelledby="faq-heading">
      <div className="container">
        <Reveal className="section-head center">
          <span className="eyebrow">FAQ</span>
          <h2 id="faq-heading">Frequently asked questions</h2>
        </Reveal>

        <div className="faq">
          {FAQS.map((item, i) => (
            <Reveal key={item.q} delay={i * 30}>
              <details>
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
