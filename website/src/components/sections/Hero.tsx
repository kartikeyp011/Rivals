import PhoneMockup from "@/components/PhoneMockup";
import Reveal from "@/components/Reveal";

export default function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-heading">
      <div className="container">
        <div className="hero-grid">
          <Reveal className="hero-copy">
            <span className="eyebrow">Daily Puzzles &amp; Wagers</span>
            <h1 id="hero-heading">
              Three quick rounds. One score. Friends to beat.
            </h1>
            <p className="lead">
              Rivals is a daily competitive puzzle app. Every day, one short
              Arena — Word Duel, Cipher Break, Number Rush — combined into a
              single Arena Score. Finish in under five minutes, then see how
              you stack up against your friends.
            </p>

            <div className="hero-ctas">
              <a href="#download" className="btn btn--warm">
                Get the app
              </a>
              <a href="#how-it-works" className="btn btn--ghost">
                See how it works
              </a>
            </div>

            <div className="hero-meta" aria-hidden="true">
              <span>
                <span className="dot" /> Under 5 minutes a day
              </span>
              <span>
                <span className="dot" /> New Arena every day
              </span>
              <span>
                <span className="dot" /> Play with friends
              </span>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <PhoneMockup />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
