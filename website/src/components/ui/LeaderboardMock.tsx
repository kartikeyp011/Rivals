const ROWS = [
  { pos: 1, name: "Priya S.", score: 2812, color: "#4F46E5", initial: "P" },
  { pos: 2, name: "Marco L.", score: 2704, color: "#16A34A", initial: "M" },
  { pos: 3, name: "Ines K.",  score: 2651, color: "#F59E0B", initial: "I" },
  { pos: 4, name: "You",      score: 2436, color: "#0F0F0F", initial: "Y", you: true },
  { pos: 5, name: "Dan W.",   score: 2298, color: "#6B6B6B", initial: "D" },
];

export default function LeaderboardMock() {
  return (
    <div className="board-table" aria-label="Example friends leaderboard">
      <div className="board-table-head">
        <span className="tab">Friends · Daily</span>
        <div className="filters" aria-hidden="true">
          <span className="active">Daily</span>
          <span>All-Time</span>
        </div>
      </div>

      {ROWS.map((row) => (
        <div
          key={row.name}
          className={`board-row${row.you ? " is-you" : ""}`}
        >
          <span className={`pos${row.pos === 1 ? " gold" : ""}`}>{row.pos}</span>
          <span className="name">
            <span
              className="avatar"
              style={{ background: row.color }}
              aria-hidden="true"
            >
              {row.initial}
            </span>
            {row.name}
            {row.you && <span className="you-tag">YOU</span>}
          </span>
          <span className="score">{row.score.toLocaleString("en-US")}</span>
          {row.you ? <span /> : <span />}
        </div>
      ))}
    </div>
  );
}
