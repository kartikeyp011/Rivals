import Reveal from "@/components/Reveal";

const STEPS = [
  {
    title: "Play three rounds",
    body:
      "Word Duel, then Cipher Break, then Number Rush. Each round is short and self-contained.",
  },
  {
    title: "Get your Arena Score",
    body:
      "Your performance across all three rounds combines into one Arena Score for the day.",
  },
  {
    title: "Compare with friends",
    body:
      "See how you rank against your friends on the Daily leaderboard — and on All-Time.",
  },
  {
    title: "Keep your streak alive",
    body:
      "Come back tomorrow for a brand-new Arena. Complete it daily to grow your streak.",
  },
];

export default function HowItWorks() {
  return (
    <section
      className="section section--tight"
      id="how-it-works"
      aria-labelledby="how-heading"
      style={{ background: "var(--bg-soft)" }}
    >
      <div className="container">
        <Reveal className="section-head center">
          <span className="eyebrow">How it works</span>
          <h2 id="how-heading">The daily loop, in four steps</h2>
          <p className="lead" style={{ margin: "0 auto" }}>
            No long onboarding, no complicated rules. Open the app, play for a
            few minutes, see where you land.
          </p>
        </Reveal>

        <div className="steps">
          {STEPS.map((s, i) => (
            <Reveal key={s.title} delay={i * 80} className="step">
              <span className="step-num" aria-hidden="true">{i + 1}</span>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
