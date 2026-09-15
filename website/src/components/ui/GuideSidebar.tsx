"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const SECTION_IDS = ["arena", "rounds", "friends", "wagers", "streaks"];

const SECTION_META: Record<string, { icon: string; label: string }> = {
  arena:   { icon: "⚡", label: "The Daily Arena" },
  rounds:  { icon: "🎮", label: "The Three Rounds" },
  friends: { icon: "🏆", label: "Friends & Leaderboard" },
  wagers:  { icon: "🪙", label: "Challenges & Wagers" },
  streaks: { icon: "🔥", label: "Streaks & Rivals+" },
};

export default function GuideSidebar() {
  const [active, setActive] = useState<string>(SECTION_IDS[0]);
  // fill[i] = 0..1, how full the line segment below item i is
  const [fill, setFill] = useState<number[]>(SECTION_IDS.map(() => 0));
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Intersection Observer: track active section
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    const visibleSections = new Map<string, number>();

    SECTION_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            visibleSections.set(id, entry.boundingClientRect.top);
          } else {
            visibleSections.delete(id);
          }
          if (visibleSections.size > 0) {
            const topmost = [...visibleSections.entries()].sort(
              (a, b) => Math.abs(a[1]) - Math.abs(b[1])
            )[0][0];
            setActive(topmost);
          }
        },
        { rootMargin: "-20% 0px -60% 0px", threshold: 0 }
      );
      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  // Scroll listener: calculate per-segment line fill %
  useEffect(() => {
    const updateFill = () => {
      const vh = window.innerHeight;
      // trigger point: 30% from top of viewport
      const trigger = vh * 0.3;

      const newFill = SECTION_IDS.map((id, i) => {
        const nextId = SECTION_IDS[i + 1];
        if (!nextId) return 0;

        const fromEl = document.getElementById(id);
        const toEl = document.getElementById(nextId);
        if (!fromEl || !toEl) return 0;

        const fromTop = fromEl.getBoundingClientRect().top;
        const toTop = toEl.getBoundingClientRect().top;

        // Fill from 0 when the section hits trigger, to 1 when next section hits trigger
        const total = toTop - fromTop;
        const progress = (trigger - fromTop) / total;
        return Math.min(1, Math.max(0, progress));
      });

      setFill(newFill);
    };

    window.addEventListener("scroll", updateFill, { passive: true });
    updateFill();
    return () => window.removeEventListener("scroll", updateFill);
  }, []);

  return (
    <div className="guide-sidebar-sticky">
      <p className="guide-sidebar-label">📖 On this page</p>
      <nav className="guide-sidebar-timeline">
        {SECTION_IDS.map((id, i) => {
          const meta = SECTION_META[id];
          const isActive = active === id;
          const isDone = SECTION_IDS.indexOf(active) > i;
          return (
            <a
              key={id}
              href={`#${id}`}
              className={`guide-sidebar-link${isActive ? " active" : ""}${isDone ? " done" : ""}`}
            >
              <div className="guide-sidebar-timeline-track">
                <div className={`guide-sidebar-dot${isActive ? " active" : isDone ? " done" : ""}`} />
                {i < SECTION_IDS.length - 1 && (
                  <div className="guide-sidebar-line-wrap">
                    {/* grey background */}
                    <div className="guide-sidebar-line" />
                    {/* animated indigo fill */}
                    <div
                      className="guide-sidebar-line-fill"
                      style={{ height: `${fill[i] * 100}%` }}
                    />
                  </div>
                )}
              </div>
              <div className="guide-sidebar-link-content">
                <span className="guide-sidebar-icon">{meta.icon}</span>
                <span>{meta.label}</span>
              </div>
            </a>
          );
        })}
      </nav>
      <div className="guide-sidebar-cta">
        <p>Ready to play?</p>
        <Link href="/#download" className="btn btn--accent">
          Get the app
        </Link>
      </div>
    </div>
  );
}
