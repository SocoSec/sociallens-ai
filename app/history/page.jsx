"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function HistoryPage() {
  const { status } = useSession();
  const [items, setItems] = useState([]);
  const [serverMode, setServerMode] = useState(false);
  const [open, setOpen] = useState(null);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "authenticated") {
      fetch("/api/history")
        .then((r) => r.json())
        .then((d) => {
          setServerMode(true);
          setItems(
            (d.analyses || []).map((a) => ({
              id: a.id,
              when: a.created_at,
              count: a.comment_count,
              summary: (a.summary || "").slice(0, 140),
              analysis: a.data,
            }))
          );
        })
        .catch(() => setItems([]));
    } else {
      try {
        setItems(JSON.parse(localStorage.getItem("sociallens_history") || "[]"));
      } catch {
        setItems([]);
      }
    }
  }, [status]);

  function clearLocal() {
    localStorage.removeItem("sociallens_history");
    setItems([]);
    setOpen(null);
  }

  return (
    <main className="container page">
      <h1>History</h1>
      {serverMode ? (
        <p>Your last 25 analyses, saved to your account.</p>
      ) : (
        <p>
          Your last 25 analyses, stored only in this browser.{" "}
          <Link href="/signin" style={{ textDecoration: "underline" }}>
            Sign in
          </Link>{" "}
          to save history to your account and unlock sentiment over time.
        </p>
      )}

      {items.length === 0 ? (
        <p className="placeholder">
          No analyses yet. Run one from the home page and it will appear here.
        </p>
      ) : (
        <>
          {!serverMode && (
            <button className="btn-secondary" onClick={clearLocal}>
              Clear history
            </button>
          )}
          <div style={{ marginTop: 16 }}>
            {items.map((item) => (
              <div key={item.id}>
                <div className="history-item">
                  <div>
                    <div className="when">
                      {new Date(item.when).toLocaleString()} · {item.count}{" "}
                      comments
                    </div>
                    <div>{item.summary}…</div>
                  </div>
                  <button
                    className="btn-secondary"
                    onClick={() => setOpen(open === item.id ? null : item.id)}
                  >
                    {open === item.id ? "Hide" : "View"}
                  </button>
                </div>
                {open === item.id && (
                  <pre className="history-json">
                    {JSON.stringify(item.analysis, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
