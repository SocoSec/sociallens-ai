"use client";

import { useEffect, useState } from "react";

export default function HistoryPage() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(null);

  useEffect(() => {
    try {
      setItems(JSON.parse(localStorage.getItem("sociallens_history") || "[]"));
    } catch {
      setItems([]);
    }
  }, []);

  function clearAll() {
    localStorage.removeItem("sociallens_history");
    setItems([]);
    setOpen(null);
  }

  return (
    <main className="container page">
      <h1>History</h1>
      <p>
        Your last 25 analyses, stored only in this browser. Nothing is saved on
        our servers.
      </p>

      {items.length === 0 ? (
        <p className="placeholder">
          No analyses yet. Run one from the home page and it will appear here.
        </p>
      ) : (
        <>
          <button className="btn-secondary" onClick={clearAll}>
            Clear history
          </button>
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
