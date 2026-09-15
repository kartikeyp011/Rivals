import Reveal from "@/components/Reveal";

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

export default function Streaks() {
  return (
    <section className="section" id="streaks" aria-labelledby="streaks-heading">
      <div className="container">
        <Reveal className="section-head">
          <span className="eyebrow">Streaks &amp; Rivalss+</span>
          <h2 id="streaks-heading">Show up daily. Or don&apos;t.</h2>
          <p className="lead">
            Complete the Daily Arena to keep your streak alive. Miss a day and
            it breaks — unless you spend your free recovery. One free pass for
            every new player.
          </p>
        </Reveal>

        <div className="streaks-grid">
          <Reveal className="streak-card">
            <span className="eyebrow">Current streak</span>
            <div className="streak-display">
              <span className="num">27</span>
              <span className="unit">days</span>
            </div>
            <p style={{ marginBottom: 0 }}>
              Beat yesterday&apos;s Arena to make it 28. Miss today and the count
              resets.
            </p>

            <div className="streak-days" aria-hidden="true">
              {DAYS.map((d, i) => (
                <div
                  key={i}
                  className={`streak-day ${
                    i < 6 ? "done" : i === 6 ? "today" : ""
                  }`}
                >
                  {d}
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={120} className="plus-card">
            <span className="plus-badge">Optional subscription</span>
            <h3>Rivalss+</h3>
            <p>
              Everything in the free game, plus a few things for the players
              who take it seriously.
            </p>

            <ul className="plus-list">
              <li>
                <span className="check" aria-hidden="true">✓</span>
                Additional streak recovery benefits
              </li>
              <li>
                <span className="check" aria-hidden="true">✓</span>
                Expanded stats and history
              </li>
              <li>
                <span className="check" aria-hidden="true">✓</span>
                Ad-free experience if ads are introduced
              </li>
            </ul>

            <p className="plus-footer">
              The core Daily Arena is always free to play.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
