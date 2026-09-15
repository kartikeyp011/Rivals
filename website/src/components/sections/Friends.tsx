import Reveal from "@/components/Reveal";
import LeaderboardMock from "@/components/ui/LeaderboardMock";

export default function Friends() {
  return (
    <section
      className="section section--soft"
      id="friends"
      aria-labelledby="friends-heading"
    >
      <div className="container">
        <div className="friends-grid">
          <Reveal>
            <span className="eyebrow">Friends &amp; Rankings</span>
            <h2 id="friends-heading">
              Beating strangers is fine. Beating friends is the point.
            </h2>
            <p className="lead">
              Add friends, run the same Arena, and see how you stack up. Daily
              and All-Time. Every score you see has been played and verified —
              not a vanity number.
            </p>

            <ul className="friends-features">
              <li>
                <span className="check" aria-hidden="true">✓</span>
                <span>
                  <strong>Friends leaderboard</strong> — Daily and All-Time
                  rankings against accepted friends only.
                </span>
              </li>
              <li>
                <span className="check" aria-hidden="true">✓</span>
                <span>
                  <strong>1v1 and multi-friend challenges</strong> — stake a
                  small amount of virtual coins and let the Arena decide.
                </span>
              </li>
              <li>
                <span className="check" aria-hidden="true">✓</span>
                <span>
                  <strong>Optional Global leaderboard</strong> — opt in when
                  you want a bigger pond. Opt out whenever you like.
                </span>
              </li>
              <li>
                <span className="check" aria-hidden="true">✓</span>
                <span>
                  <strong>Coins are virtual only.</strong> No cash value, no
                  withdrawals. Just bragging rights.
                </span>
              </li>
            </ul>
          </Reveal>

          <Reveal delay={120}>
            <LeaderboardMock />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
