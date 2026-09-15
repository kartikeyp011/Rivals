import ScoreCount from "./ScoreCount";

export default function MobileMockup({ variant = "scoreboard" }: { variant?: "scoreboard" | "splash" }) {
  return (
    <div className={`mobile-frame ${variant}`} aria-label="Mobile app mockup">
      {/* Hardware Details */}
      <div className="mobile-island"></div>
      <div className="mobile-power-button"></div>
      <div className="mobile-volume-up"></div>
      <div className="mobile-volume-down"></div>
      
      {/* Screen Content */}
      <div className="mobile-screen">
        {/* Status Bar */}
        <div className={`mobile-status-bar ${variant === 'splash' ? 'splash-status' : ''}`}>
          <span className="time">9:41</span>
          <div className="system-icons">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 22 1.33-21.4 1.33-20.67V5.33C17 4.6 16.4 4 15.67 4z"/></svg>
          </div>
        </div>

        {variant === "splash" ? (
          <div className="mobile-splash">
            <div className="splash-logo">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                <polyline points="2 17 12 22 22 17"></polyline>
                <polyline points="2 12 12 17 22 12"></polyline>
              </svg>
              <span>RIVALS</span>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="mobile-header">
              <div className="m-date">Today · Arena #128</div>
              <div className="m-live">Live</div>
            </div>

            {/* Main Score Area */}
            <div className="mobile-hero">
              <div className="m-score-label">Arena Score</div>
              <div className="m-score-value">
                <ScoreCount to={2436} />
                <span className="m-of">/ 3000</span>
              </div>
              <div className="m-score-delta">▲ +312 vs yesterday</div>
            </div>

            {/* Rounds */}
            <div className="mobile-rounds">
              <div className="m-round">
                <div className="mr-info">
                  <span className="mr-icon word">W</span>
                  <span className="mr-name">Word Duel</span>
                </div>
                <div className="mr-score">842 <span className="mr-max">/1000</span></div>
              </div>
              <div className="m-round">
                <div className="mr-info">
                  <span className="mr-icon cipher">C</span>
                  <span className="mr-name">Cipher Break</span>
                </div>
                <div className="mr-score">816 <span className="mr-max">/1000</span></div>
              </div>
              <div className="m-round">
                <div className="mr-info">
                  <span className="mr-icon number">N</span>
                  <span className="mr-name">Number Rush</span>
                </div>
                <div className="mr-score">778 <span className="mr-max">/1000</span></div>
              </div>
            </div>

            {/* Footer Area */}
            <div className="mobile-footer">
              <div className="m-rank">
                <span className="m-dot"></span> Rank #4 of 12 friends
              </div>
              <div className="m-streak">Streak · 27 days</div>
            </div>
          </>
        )}
        
        {/* Home Indicator */}
        <div className={`mobile-home-indicator ${variant === 'splash' ? 'splash-home' : ''}`}></div>
      </div>
    </div>
  );
}
