import Reveal from "@/components/Reveal";

export default function Streaks() {
  return (
    <section className="section" id="streaks" aria-labelledby="streaks-heading">
      <div className="container">
        <div className="split">
          <Reveal>
            <span className="eyebrow">Streaks &amp; Rivalss+</span>
            <h2 id="streaks-heading">A reason to come back tomorrow</h2>
            <p className="lead">
              Complete the Daily Arena to grow your streak. Miss a day and it
              breaks — but every new player gets one free recovery to use when
              they need it.
            </p>

            <ul className="bullets">
              <li>
                <span className="tick" aria-hidden="true">✓</span>
                Track your current and longest streak.
              </li>
              <li>
                <span className="tick" aria-hidden="true">✓</span>
                One free streak recovery for every new player.
              </li>
              <li>
                <span className="tick" aria-hidden="true">✓</span>
                Want more? <strong>Rivalss+</strong> adds extra streak
                recovery, expanded stats and history, and an ad-free
                experience if ads are introduced.
              </li>
            </ul>

            <div className="notice">
              Rivalss+ is an optional subscription. The core Daily Arena is
              always free to play.
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="card" style={{ textAlign: "left" }}>
              <div className="card-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3s6 4 6 9a6 6 0 0 1-12 0c0-5 6-9 6-9z" />
                  <path d="M12 17v-6M9.5 13.5h5" />
                </svg>
              </div>
              <h3>Rivalss+</h3>
              <p style={{ marginBottom: 0 }}>
                Additional streak recovery, more stats and history, and an
                ad-free experience if ads are added. Managed through the App
                Store and Galaxy Store. Cancel anytime.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
