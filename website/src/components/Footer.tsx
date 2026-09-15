import Link from "next/link";

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
              <li><Link href="/#gameplay">Gameplay</Link></li>
              <li><Link href="/#how-it-works">How it works</Link></li>
              <li><Link href="/#download">Download</Link></li>
              <li><Link href="/#faq">FAQ</Link></li>
            </ul>
          </div>

          <div>
            <h4>Company</h4>
            <ul>
              <li><Link href="/#faq">Support</Link></li>
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
              <li><Link href="/privacy">Privacy Policy</Link></li>
              <li><Link href="/terms">Terms of Service</Link></li>
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
