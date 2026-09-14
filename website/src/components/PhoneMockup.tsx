/**
 * Hero device mockup — a tasteful placeholder.
 *
 * TODO: Replace the screen contents below with a real app screenshot
 * before launch. Suggested approach:
 *   1. Export a 1080x2280 PNG of the Arena screen.
 *   2. Save it at /public/screenshot-arena.png.
 *   3. Replace the `<div className="phone-screen">…</div>` block with:
 *        <img
 *          src="/screenshot-arena.png"
 *          alt="Rivals Daily Arena screen"
 *          className="phone-screen-img"
 *        />
 *      and add `.phone-screen-img { width:100%; height:100%;
 *      border-radius:30px; object-fit:cover; }` to globals.css.
 */

export default function PhoneMockup() {
  return (
    <div className="phone-wrap" aria-hidden="true">
      <div className="phone">
        <div className="phone-screen">
          <div>
            <div className="phone-tag">Today&apos;s Arena</div>
            <div className="phone-title">3 rounds.</div>
            <div className="phone-sub">One score. One shot.</div>
          </div>

          <div className="phone-rounds">
            <div className="round-pill">
              <span>Word Duel</span>
              <span>Round 1</span>
            </div>
            <div className="round-pill">
              <span>Cipher Break</span>
              <span>Round 2</span>
            </div>
            <div className="round-pill">
              <span>Number Rush</span>
              <span>Round 3</span>
            </div>
          </div>

          <div className="phone-footer">Arena Score · Friends · Streak</div>
        </div>
      </div>
    </div>
  );
}
