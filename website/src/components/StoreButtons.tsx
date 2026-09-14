/**
 * Store buttons.
 *
 * The app is not yet publicly available. Both stores are marked
 * "Coming Soon" and are non-interactive to avoid fake links.
 *
 * TODO: when the app goes live, replace `aria-disabled` with real
 * hrefs to the App Store and Samsung Galaxy Store listings, and
 * remove the "Coming Soon" badge.
 */

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.365 1.43c0 1.14-.42 2.2-1.18 3.04-.9 1-2.03 1.57-3.13 1.48-.06-1.1.44-2.26 1.15-3.05.83-.9 2.18-1.55 3.16-1.47zM20.5 17.1c-.55 1.27-.82 1.83-1.53 2.95-.99 1.56-2.38 3.5-4.11 3.51-1.53.02-1.93-.99-4-.98-2.07.01-2.5 1-4.03.98-1.73-.02-3.05-1.77-4.04-3.33C-.3 15.98-.62 11.01 1.3 8.45c1.36-1.81 3.5-2.87 5.51-2.87 2.05 0 3.34 1.03 5.03 1.03 1.64 0 2.64-1.03 5-1.03 1.8 0 3.7.98 5.06 2.68-4.44 2.43-3.72 8.77-1.4 8.84z" />
    </svg>
  );
}

function GalaxyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2c5.52 0 10 4.48 10 10s-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2zm0 3.2a6.8 6.8 0 100 13.6 6.8 6.8 0 000-13.6zm0 2.2a4.6 4.6 0 110 9.2 4.6 4.6 0 010-9.2zm0 2.2a2.4 2.4 0 100 4.8 2.4 2.4 0 000-4.8z" />
    </svg>
  );
}

export default function StoreButtons() {
  return (
    <div className="store-grid">
      <div className="store-btn" aria-disabled="true" role="link">
        <span className="store-icon"><AppleIcon /></span>
        <span className="store-text">
          <small>iOS</small>
          <strong>App Store</strong>
        </span>
        <span className="store-badge">Coming soon</span>
      </div>

      <div className="store-btn" aria-disabled="true" role="link">
        <span className="store-icon"><GalaxyIcon /></span>
        <span className="store-text">
          <small>Android</small>
          <strong>Galaxy Store</strong>
        </span>
        <span className="store-badge">Coming soon</span>
      </div>
    </div>
  );
}
