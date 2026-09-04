"use client";

import { useReportWebVitals } from "next/web-vitals";

type Metric = {
  id: string;
  name: string;
  value: number;
  label?: string;
};

function reportWebVitals(metric: Metric) {
  const ga = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  if (!ga || typeof window === "undefined") return;
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
  gtag?.("event", metric.name, {
    value: Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value),
    event_label: metric.id,
    non_interaction: true,
  });
}

export function WebVitals() {
  useReportWebVitals(reportWebVitals);
  return null;
}
