import Reveal from "@/components/Reveal";
import MobileMockup from "@/components/ui/MobileMockup";

export default function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-heading">
      <div className="container">
        <div className="hero-grid">
          <Reveal className="hero-copy">
            <h1 id="hero-heading">
              Three rounds.<br/>
              <span className="accent">One score.</span><br/>
              Every single day.
            </h1>

            <p className="lead">
              Rivals is the fast daily competition where you play three quick games—Word Duel, Cipher Break, and
              Number Rush—to build your Arena Score. Challenge friends and play in under five minutes a day.
            </p>

            <div className="hero-ctas">
              <a href="#download" className="btn btn--accent btn--lg">
                Get the app
              </a>
              <a href="#how-it-works" className="btn btn--ghost btn--lg">
                See how it works
              </a>
            </div>

            <div className="hero-stats" aria-hidden="true">
              <div className="hero-stat">
                <strong>&lt; 5</strong>
                <span>Minutes</span>
              </div>
              <div className="hero-stat">
                <strong>3</strong>
                <span>Rounds</span>
              </div>
              <div className="hero-stat">
                <strong>1</strong>
                <span>Score</span>
              </div>
              <div className="hero-stat">
                <strong>∞</strong>
                <span>Rivals</span>
              </div>
            </div>
          </Reveal>

          <Reveal delay={120} className="dual-mockup-container">
            <div className="mockup-front">
              <MobileMockup variant="scoreboard" />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
