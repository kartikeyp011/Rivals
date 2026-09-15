import Reveal from "@/components/Reveal";

const STEPS = [
  {
    num: "01",
    title: "Play three rounds",
    body:
      "Word Duel, Cipher Break, Number Rush. Short, sharp, back-to-back. No filler.",
  },
  {
    num: "02",
    title: "Get your Arena Score",
    body:
      "Your performance across all three combines into one number for the day. That number is what counts.",
  },
  {
    num: "03",
    title: "Beat your friends",
    body:
      "See where you land on the Daily and All-Time leaderboards. Keep the streak. Come back tomorrow.",
  },
];

const PlaceholderIcon1 = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
  </svg>
);
const PlaceholderIcon2 = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
  </svg>
);
const PlaceholderIcon3 = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
  </svg>
);
const ICONS = [PlaceholderIcon1, PlaceholderIcon2, PlaceholderIcon3];

export default function DailyLoop() {
  return (
    <section className="section section--soft" id="how-it-works" aria-labelledby="how-heading">
      <div className="container">
        <Reveal className="section-head center">
          <span className="eyebrow">The daily loop</span>
          <h2 id="how-heading">Same time. Same rules. Different score.</h2>
          <p className="lead">
            Every day, one new Arena. You know exactly what to expect — the
            question is whether you can beat yesterday, and beat your friends.
          </p>
        </Reveal>
        <Reveal>
          <div className="loop">
            {STEPS.map((step, idx) => {
              const Icon = ICONS[idx];
              return (
                <div key={step.num} className="loop-step">
                  <div className="loop-icon"><Icon /></div>
                  <span className="loop-num">{step.num}</span>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </div>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
