"use client";

import { useState } from "react";

export default function FaqItem({ q, a }: { q: string; a: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`faq-item ${isOpen ? "open" : ""}`}>
      <button 
        className="faq-summary" 
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        {q}
        <span className="faq-icon">+</span>
      </button>
      <div className="faq-content-wrapper">
        <div className="faq-content">
          <p>{a}</p>
        </div>
      </div>
    </div>
  );
}
