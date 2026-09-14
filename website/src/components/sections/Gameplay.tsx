import Reveal from "@/components/Reveal";

const ROUNDS = [
  {
    badge: "Round 1",
    name: "Word Duel",
    body:
      "A word-based puzzle to open the Arena. Quick to read, quick to answer — but easy to overthink.",
  },
  {
    badge: "Round 2",
    name: "Cipher Break",
    body:
      "Crack the code. Cipher Break comes in Easy, Medium, and Hard tiers, so some days are noticeably tougher than others.",
    chips: ["Easy", "Medium", "Hard"],
  },
  {
    badge: "Round 3",
    name: "Number Rush",
    body:
      "A number-based puzzle to close things out. Sharpen up — this is where the Arena Score is often decided.",
  },
];

export default function Gameplay() {
  return (
    <section className="section" id="gameplay" aria-labelledby="gameplay-heading">
      <div className="container">
        <Reveal className="section-head">
          <span className="eyebrow">The Arena</span>
          <h2 id="gameplay-heading">Three rounds, three different puzzles</h2>
          <p className="lead">
            Each round in the Daily Arena plays differently on purpose. The
            combined Arena Score rewards well-rounded players, not one-trick
            specialists.
          </p>
        </Reveal>

        <div className="grid-3">
          {ROUNDS.map((r, i) => (
            <Reveal key={r.name} delay={i * 80} className="round-card">
              <span className="round-badge">{r.badge}</span>
              <h3>{r.name}</h3>
              <p>{r.body}</p>
              {r.chips && (
                <div className="difficulty-row">
                  {r.chips.map((c) => (
                    <span key={c} className="chip">{c}</span>
                  ))}
                </div>
              )}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
