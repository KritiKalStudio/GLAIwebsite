"use client";

import { useEffect } from "react";

/** Adds one restrained entrance transition as editorial content enters view. */
export function MotionObserver() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    document.documentElement.dataset.motion = "ready";

    const items = document.querySelectorAll<HTMLElement>("[data-reveal]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.setAttribute("data-revealed", "true");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -24px" },
    );

    items.forEach((item) => observer.observe(item));
    return () => {
      observer.disconnect();
      delete document.documentElement.dataset.motion;
    };
  }, []);

  return null;
}
