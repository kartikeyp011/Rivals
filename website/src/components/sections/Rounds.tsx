import Reveal from "@/components/Reveal";
import RoundPreview from "@/components/ui/RoundPreview";

export default function Rounds() {
  return (
    <section className="section" id="gameplay" aria-labelledby="gameplay-heading">
      <div className="container">
        <Reveal className="section-head center">
          <span className="eyebrow">The Arena</span>
          <h2 id="gameplay-heading">Three rounds. Three ways to win.</h2>
          <p className="lead">
            Each round tests something different. The Arena Score rewards
            all-rounders, not one-trick specialists — so every day is a fresh
            fight.
          </p>
        </Reveal>

        <div className="rounds-grid">
          <Reveal>
            <RoundPreview
              round="word"
              roundNum="ROUND 01"
              tag="Word"
              title="Word Duel"
              description="Crack the word in as few guesses as you can. Fast, brutal, and easy to overthink."
              maxScore="1000"
            />
          </Reveal>
          <Reveal delay={100}>
            <RoundPreview
              round="cipher"
              roundNum="ROUND 02"
              tag="Cipher"
              title="Cipher Break"
              description="Decode the pattern. Rotates between Easy, Medium, and Hard tiers — some days bite back."
              maxScore="1000"
            />
          </Reveal>
          <Reveal delay={200}>
            <RoundPreview
              round="number"
              roundNum="ROUND 03"
              tag="Number"
              title="Number Rush"
              description="Find the pattern, hit the answer. The round where Arena Scores are won and lost."
              maxScore="1000"
            />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
