import Reveal from "@/components/Reveal";

export default function Competition() {
  return (
    <section
      className="section section--dark"
      id="competition"
      aria-labelledby="competition-heading"
    >
      <div className="container">
        <div className="split">
          <Reveal>
            <span className="eyebrow">Friends &amp; wagers</span>
            <h2 id="competition-heading">
              Compete with people you actually know
            </h2>
            <p className="lead">
              The friends leaderboard is the heart of Rivals. Add a few
              friends, complete the Arena, and see how the day shakes out —
              Daily and All-Time.
            </p>

            <ul className="bullets">
              <li>
                <span className="tick" aria-hidden="true">✓</span>
                Send and accept friend requests, manage your list.
              </li>
              <li>
                <span className="tick" aria-hidden="true">✓</span>
                Daily and All-Time rankings against accepted friends only.
              </li>
              <li>
                <span className="tick" aria-hidden="true">✓</span>
                Optionally opt in to the Global leaderboard.
              </li>
              <li>
                <span className="tick" aria-hidden="true">✓</span>
                Challenge a friend — 1v1 or a small multi-friend pot — using
                virtual coins.
              </li>
            </ul>
          </Reveal>

          <Reveal delay={100}>
            <div className="card" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(246,239,227,0.14)" }}>
              <h3 style={{ color: "var(--text-invert)" }}>
                About coins &amp; wagers
              </h3>
              <p>
                Coins in Rivals are virtual, have no cash value, and cannot be
                withdrawn or exchanged for real money. Every new player starts
                with 100 coins. You can challenge friends with a small stake
                (10, 25, or 50 coins) — the higher Arena Score takes the pot.
              </p>
              <div className="notice">
                Rivals is a game of skill between friends. Coins are for fun
                only and never convert to real money.
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
