import ScoreCount from "./ScoreCount";

/**
 * The recurring scoreboard motif — a large card showing the day's
 * Arena Score plus the three round scores. Rendered as real UI,
 * not a screenshot.
 *
 * TODO: When real screenshots are available, this component can be
 * swapped for a static image without touching any other file.
 */
export default function ScoreboardStrip() {
  return (
    <div className="board" aria-label="Example Arena scoreboard">
      <div className="board-head">
        <span className="date">Today · Arena #128</span>
        <span className="live">Live</span>
      </div>

      <div className="score-hero">
        <div className="score-label">Arena Score</div>
        <div className="score-value">
          <ScoreCount to={2436} />
          <span className="of">/ 3000</span>
        </div>
        <div className="score-delta">▲ +312 vs yesterday</div>
      </div>

      <div className="rounds-list">
        <div className="round-cell">
          <div className="rname">Word Duel</div>
          <div className="rscore">842</div>
          <div className="rmax">/ 1000</div>
        </div>
        <div className="round-cell">
          <div className="rname">Cipher Break</div>
          <div className="rscore">816</div>
          <div className="rmax">/ 1000</div>
        </div>
        <div className="round-cell">
          <div className="rname">Number Rush</div>
          <div className="rscore">778</div>
          <div className="rmax">/ 1000</div>
        </div>
      </div>

      <div className="board-foot">
        <span className="rank">
          <span className="dot" aria-hidden="true" /> Rank #4 of 12 friends
        </span>
        <span>Streak · 27 days</span>
      </div>
    </div>
  );
}
