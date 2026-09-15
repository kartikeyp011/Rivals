"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const NAV = [
  { href: "/#gameplay", label: "Gameplay" },
  { href: "/guide", label: "Guide" },
  { href: "/#faq", label: "FAQ" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let upScrollDelta = 0;
    let downScrollDelta = 0;

    const onScroll = () => {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY;
      
      // Add background when scrolled past 6px
      setScrolled(currentScrollY > 6);
      
      if (delta > 0) {
        // Scrolling down
        downScrollDelta += delta;
        upScrollDelta = 0;
        
        if (downScrollDelta > 100 && currentScrollY > 100) {
          setHidden(true);
        }
      } else if (delta < 0) {
        // Scrolling up
        upScrollDelta += Math.abs(delta);
        downScrollDelta = 0;
        
        if (upScrollDelta > 100 || currentScrollY < 100) {
          setHidden(false);
        }
      }
      
      lastScrollY = currentScrollY;
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="site-header" data-scrolled={scrolled} data-hidden={hidden}>
      <nav className="nav" aria-label="Primary">
        <Link href="/" className="brand" aria-label="Rivals — home">
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
