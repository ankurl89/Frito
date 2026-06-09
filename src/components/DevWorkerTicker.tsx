"use client";

/**
 * Dev-only worker ticker.
 *
 * Nudges the job worker every 12s so the fulfillment pipeline visibly
 * progresses during local development (sandbox order simulation, retries).
 *
 * Renders nothing. Only active on localhost — a no-op everywhere else, and the
 * /api/jobs/tick endpoint it calls is hard-disabled in production.
 */

import { useEffect } from "react";

export default function DevWorkerTicker() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!/localhost|127\.0\.0\.1/.test(window.location.host)) return;

    const tick = () => fetch("/api/jobs/tick", { method: "POST" }).catch(() => {});
    tick();
    const id = setInterval(tick, 12000);
    return () => clearInterval(id);
  }, []);

  return null;
}
