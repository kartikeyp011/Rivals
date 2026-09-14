"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const NAV = [
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#gameplay", label: "Gameplay" },
  { href: "/#faq", label: "FAQ" },
  { href: "/support", label: "Support" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="site-header" data-scrolled={scrolled}>
      <div className="container">
        <nav className="nav" aria-label="Primary">
          <Link href="/" className="brand" aria-label="Rivals — home">
            <span className="brand-mark" aria-hidden="true">R</span>
            Rivals
          </Link>

          <ul className="nav-links">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>

          <div className="nav-cta">
            <Link href="/#download" className="btn btn--primary">
              Get the app
            </Link>
          </div>

          <button
            type="button"
            className="menu-toggle"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            <span aria-hidden="true" />
          </button>
        </nav>
      </div>

      {open && (
        <div id="mobile-menu" className="mobile-menu">
          <ul>
            {NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} onClick={() => setOpen(false)}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/#download"
            className="btn btn--primary"
            onClick={() => setOpen(false)}
          >
            Get the app
          </Link>
        </div>
      )}
    </header>
  );
}
