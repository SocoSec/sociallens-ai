"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function SentimentOverTime({ version }) {
  const { status } = useSession();
  const [items, setItems] = useState(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/history")
      .then((r) => r.json())
      .then((d) => setItems(d.analyses || []))
      .catch(() => setItems([]));
  }, [status, version]);

  if (status !== "authenticated") {
    return (
      <div className="locked-note">
        Sentiment tracking over time is available for signed-in users.
        <br />
        <Link href="/signin" className="lock-cta" style={{ display: "inline-block", marginTop: 10 }}>
          Sign in to unlock
        </Link>
      </div>
    );
  }

  if (items === null) {
    return <p className="placeholder">Loading your history…</p>;
  }

  if (items.length < 2) {
    return (
      <p className="placeholder">
        Run at least two analyses to see how sentiment changes over time.
      </p>
    );
  }

  const points = [...items].reverse().slice(-12);
  const w = 280;
  const h = 90;
  const step = points.length > 1 ? w / (points.length - 1) : 0;
  const y = (v) => h - (v / 100) * h;
  const line = (key) =>
    points.map((p, i) => `${i === 0 ? "M" : "L"}${i * step},${y(p[key] || 0)}`).join(" ");

  return (
    <div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="trend-svg"
        role="img"
        aria-label="Positive and negative sentiment across your recent analyses"
      >
        <path d={line("positive")} fill="none" stroke="var(--pos)" strokeWidth="2" />
        <path d={line("negative")} fill="none" stroke="var(--neg)" strokeWidth="2" />
      </svg>
      <div className="spine-legend" style={{ marginBottom: 0, marginTop: 8 }}>
        <span><span className="dot pos" />Positive</span>
        <span><span className="dot neg" />Negative</span>
        <span style={{ marginLeft: "auto" }}>{points.length} analyses</span>
      </div>
    </div>
  );
}
