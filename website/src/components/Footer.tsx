export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="footer-brand">
              <span className="brand-mark" aria-hidden="true">R</span>
              Rivals
            </div>
            <p style={{ color: "rgba(255,255,255,0.6)", maxWidth: 300, marginBottom: 0 }}>
              A daily competitive puzzle arena. Three rounds, one score,
              under five minutes.
            </p>
          </div>

          <div>
            <h4>Product</h4>
            <ul>
              <li><a href="/#gameplay">Gameplay</a></li>
              <li><a href="/#how-it-works">How it works</a></li>
              <li><a href="/#download">Download</a></li>
              <li><a href="/#faq">FAQ</a></li>
            </ul>
          </div>

          <div>
            <h4>Company</h4>
            <ul>
              <li><a href="/support">Support</a></li>
              <li>
                <a href="mailto:kartikeyp011@gmail.com">
                  kartikeyp011@gmail.com
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4>Legal</h4>
            <ul>
              <li><a href="/privacy">Privacy Policy</a></li>
              <li><a href="/terms">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {year} Rivals. All rights reserved.</span>
          <span>Coins in Rivals are virtual and have no cash value.</span>
        </div>
      </div>
    </footer>
  );
}
