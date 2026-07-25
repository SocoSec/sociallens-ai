"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Papa from "papaparse";

const TABS = [
  { id: "paste", label: "Paste comments" },
  { id: "csv", label: "Upload CSV" },
  { id: "youtube", label: "YouTube" },
  { id: "facebook", label: "Facebook" },
  { id: "instagram", label: "Instagram" },
];

const SAMPLE_COMMENTS = [
  "This tutorial finally made hooks click for me, thank you!!",
  "Audio is way too quiet compared to your last video",
  "Can you do a follow-up on server components?",
  "I've watched this three times. Best explanation on YouTube.",
  "The intro is too long, almost skipped the whole thing",
  "What theme/font are you using in VS Code?",
  "Bought your course after this. Worth every penny.",
  "Please add chapters, it's hard to find the section I need",
  "The pacing in the second half was perfect",
  "Mic quality dropped around 12:40, anyone else notice?",
  "Would love a version of this for Vue",
  "Honestly the best channel for practical dev content",
  "This is outdated, the API changed last month",
  "Subtitles are out of sync on mobile",
  "Great energy as always! Keep it up",
  "Can you share the repo link? It's not in the description",
  "First video of yours I've seen. Instantly subscribed.",
  "Too many sponsor reads lately, it breaks the flow",
  "The diagram at 5:20 cleared up years of confusion for me",
  "When is the next livestream?",
];

function detectPlatform(text) {
  try {
    const u = new URL(text.trim());
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be" || host.endsWith("youtube.com")) return "youtube";
    if (host.endsWith("facebook.com") || host === "fb.watch") return "facebook";
    if (host.endsWith("instagram.com")) return "instagram";
    return "unknown-url";
  } catch {
    return "not-a-url";
  }
}

function extractCommentsFromCsv(results) {
  const rows = results.data.filter((r) => r && r.length);
  if (!rows.length) return [];
  const header = rows[0].map((h) => String(h || "").toLowerCase().trim());
  const nameHit = header.findIndex((h) =>
    ["comment", "comments", "text", "message", "body", "content"].includes(h)
  );
  if (nameHit >= 0) {
    return rows
      .slice(1)
      .map((r) => String(r[nameHit] || "").trim())
      .filter(Boolean);
  }
  return rows
    .map((r) => {
      const cells = r.map((c) => String(c || "").trim());
      return cells.sort((a, b) => b.length - a.length)[0] || "";
    })
    .filter(Boolean);
}

export default function Home() {
  const [heroUrl, setHeroUrl] = useState("");
  const [tab, setTab] = useState("paste");
  const [rawText, setRawText] = useState("");
  const [csvComments, setCsvComments] = useState([]);
  const [csvName, setCsvName] = useState("");
  const [fetchedComments, setFetchedComments] = useState([]);
  const [fetchedLabel, setFetchedLabel] = useState("");
  const [url, setUrl] = useState("");
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [lockOpen, setLockOpen] = useState(false);
  const fileRef = useRef(null);
  const resultsRef = useRef(null);

  const comments = useMemo(() => {
    if (tab === "csv") return csvComments;
    if (tab === "youtube" || tab === "facebook" || tab === "instagram")
      return fetchedComments;
    return rawText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
  }, [tab, rawText, csvComments, fetchedComments]);

  const handleFile = useCallback((file) => {
    if (!file) return;
    setCsvName(file.name);
    Papa.parse(file, {
      skipEmptyLines: true,
      complete: (results) => {
        const extracted = extractCommentsFromCsv(results);
        setCsvComments(extracted);
        setError(extracted.length ? "" : "No comment text found in that CSV.");
      },
      error: () => setError("Could not read that file. Is it a valid CSV?"),
    });
  }, []);

  async function fetchComments(platform, link) {
    const res = await fetch(
      `/api/${platform}?url=${encodeURIComponent(link)}`
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Could not fetch comments.");
    return data;
  }

  async function fetchFromPlatform(platform) {
    setError("");
    setFetching(true);
    setFetchedComments([]);
    try {
      const data = await fetchComments(platform, url);
      setFetchedComments(data.comments);
      setFetchedLabel(data.title || url);
    } catch (e) {
      setError(e.message);
    } finally {
      setFetching(false);
    }
  }

  async function runAnalysis(overrideComments) {
    const toAnalyze = overrideComments || comments;
    if (!toAnalyze.length) {
      setError(
        "Add some comments first — paste a link above, or use the panel below."
      );
      return;
    }
    setError("");
    setLoading(true);
    setLoadingMsg(`Reading ${toAnalyze.length} comments and building your report…`);
    setAnalysis(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comments: toAnalyze }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed.");
      setAnalysis(data);
      saveToHistory(toAnalyze.length, data);
      requestAnimationFrame(() =>
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function analyzeFromHero() {
    const link = heroUrl.trim();
    if (!link) {
      setError("Paste a YouTube or Facebook link first — or use the panel below for raw comments and CSVs.");
      return;
    }
    const platform = detectPlatform(link);
    if (platform === "instagram") {
      setTab("instagram");
      setError(
        "Instagram needs a connected professional account. Export your comments to CSV and use the Upload CSV tab below."
      );
      return;
    }
    if (platform === "not-a-url") {
      setTab("paste");
      setRawText(link);
      setError(
        "That doesn't look like a link, so I've placed it in the Paste comments tab below — add one comment per line and press Analyze."
      );
      return;
    }
    if (platform === "unknown-url") {
      setError("That link isn't from YouTube or Facebook. Those are the two supported platforms for direct import.");
      return;
    }
    setError("");
    setLoading(true);
    setLoadingMsg("Fetching comments…");
    setAnalysis(null);
    try {
      setTab(platform);
      setUrl(link);
      const data = await fetchComments(platform, link);
      setFetchedComments(data.comments);
      setFetchedLabel(data.title || link);
      setLoadingMsg(
        `Reading ${data.comments.length} comments and building your report…`
      );
      await runAnalysis(data.comments);
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  }

  function saveToHistory(count, data) {
    try {
      const item = {
        id: Date.now(),
        when: new Date().toISOString(),
        count,
        summary: data.summary?.slice(0, 140) || "",
        analysis: data,
      };
      const prev = JSON.parse(localStorage.getItem("sociallens_history") || "[]");
      localStorage.setItem(
        "sociallens_history",
        JSON.stringify([item, ...prev].slice(0, 25))
      );
    } catch {
      /* storage unavailable — history is optional */
    }
  }

  function loadSample() {
    setTab("paste");
    setRawText(SAMPLE_COMMENTS.join("\n"));
    runAnalysis(SAMPLE_COMMENTS);
  }

  const sentiment = analysis?.sentiment;

  return (
    <main>
      <section className="hero">
        <div className="container">
          <span className="eyebrow">AI-powered comment intelligence</span>
          <h1>
            Understand your comments <span className="grad-text">in seconds</span>
          </h1>
          <p className="lede">
            Paste a YouTube, Instagram, or Facebook link — or raw comments —
            and get an instant summary, topics, sentiment, and keywords.
          </p>

          <div className="smart-bar">
            <input
              placeholder="Paste a YouTube, Instagram, or Facebook link…"
              value={heroUrl}
              onChange={(e) => setHeroUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && analyzeFromHero()}
              aria-label="Link to analyze"
            />
            <button
              className="btn-grad"
              onClick={analyzeFromHero}
              disabled={loading}
            >
              {loading ? "Working…" : "Analyze"}
            </button>
          </div>

          <p className="sample-line">
            New here?{" "}
            <button className="sample-link" onClick={loadSample}>
              See a sample analysis
            </button>{" "}
            — no setup needed.
          </p>

          <div className="chip-row">
            <span className="chip">Summary</span>
            <span className="chip">Topics</span>
            <span className="chip">Sentiment</span>
            <span className="chip">Keywords</span>
          </div>

          <div className="card input-card">
            <div className="tabs" role="tablist" aria-label="Comment source">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={tab === t.id}
                  className="tab"
                  onClick={() => {
                    setTab(t.id);
                    setError("");
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tab === "paste" && (
              <textarea
                className="comment-box"
                placeholder={"One comment per line…\n\nGreat video!\nAudio was a bit quiet\nCan you cover X next?"}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
              />
            )}

            {tab === "csv" && (
              <div
                className={`dropzone${dragging ? " dragging" : ""}`}
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  handleFile(e.dataTransfer.files?.[0]);
                }}
              >
                {csvName ? (
                  <span>
                    <strong>{csvName}</strong> — {csvComments.length} comments
                    loaded. Click to replace.
                  </span>
                ) : (
                  <span>
                    Drop a CSV here, or click to browse. A column named
                    “comment” or “text” works best.
                  </span>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,text/csv"
                  hidden
                  onChange={(e) => handleFile(e.target.files?.[0])}
                />
              </div>
            )}

            {tab === "youtube" && (
              <div>
                <p className="hint">
                  Paste a video link to import up to 1,000 comments.
                </p>
                <div className="input-row">
                  <input
                    className="url-input"
                    placeholder="https://www.youtube.com/watch?v=…"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                  <button
                    className="btn-secondary"
                    onClick={() => fetchFromPlatform("youtube")}
                    disabled={fetching || !url}
                  >
                    {fetching ? "Fetching…" : "Fetch comments"}
                  </button>
                </div>
              </div>
            )}

            {tab === "facebook" && (
              <div>
                <p className="hint">
                  Paste a public post, video, or reel link to import up to
                  1,000 comments.
                </p>
                <div className="input-row">
                  <input
                    className="url-input"
                    placeholder="https://www.facebook.com/…"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                  <button
                    className="btn-secondary"
                    onClick={() => fetchFromPlatform("facebook")}
                    disabled={fetching || !url}
                  >
                    {fetching ? "Fetching…" : "Fetch comments"}
                  </button>
                </div>
              </div>
            )}

            {tab === "instagram" && (
              <p className="hint" style={{ margin: 0 }}>
                Instagram requires connecting a professional account through
                the Meta API. In the meantime, export your comments to CSV
                (many tools do this) and use the <strong>Upload CSV</strong>{" "}
                tab.
              </p>
            )}

            <div className="meta-row">
              <span className="count-chip">
                <strong>{comments.length}</strong> comments detected
                {fetchedLabel &&
                (tab === "youtube" || tab === "facebook")
                  ? ` · ${fetchedLabel}`
                  : ""}
              </span>
              <button
                className="btn-grad"
                onClick={() => runAnalysis()}
                disabled={loading || comments.length === 0}
              >
                {loading ? "Analyzing…" : "Analyze"}
              </button>
            </div>
          </div>

          {error && (
            <div className="error-banner" role="alert">
              {error}
            </div>
          )}
          {loading && (
            <div className="loading-banner">
              <span className="spinner" aria-hidden="true" />
              {loadingMsg}
            </div>
          )}
        </div>
      </section>

      <section className="container" ref={resultsRef}>
        {sentiment && (
          <>
            <div className="spine" aria-label="Sentiment split">
              <div className="seg-pos" style={{ width: `${sentiment.positive}%` }} />
              <div className="seg-neu" style={{ width: `${sentiment.neutral}%` }} />
              <div className="seg-neg" style={{ width: `${sentiment.negative}%` }} />
            </div>
            <div className="spine-legend">
              <span><span className="dot pos" />Positive {sentiment.positive}%</span>
              <span><span className="dot neu" />Neutral {sentiment.neutral}%</span>
              <span><span className="dot neg" />Negative {sentiment.negative}%</span>
            </div>
          </>
        )}

        <div className="results-grid">
          <ResultCard title="Summary" wide>
            {analysis ? (
              <p className="summary-text">{analysis.summary}</p>
            ) : (
              <Empty />
            )}
          </ResultCard>

          <ResultCard title="Sentiment Over Time">
            <div className="locked-note">
              Sentiment tracking over time is available for signed-in users.
              <br />
              <button className="lock-cta" onClick={() => setLockOpen(true)}>
                Sign in to unlock
              </button>
            </div>
          </ResultCard>

          <ResultCard title="Topics">
            {analysis?.topics?.length ? (
              <ul className="pill-list">
                {analysis.topics.map((t, i) => (
                  <li key={i}>
                    {t.name}
                    <span className="freq">{t.share}%</span>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty />
            )}
          </ResultCard>

          <ResultCard title="Keywords">
            {analysis?.keywords?.length ? (
              <ul className="pill-list">
                {analysis.keywords.map((k, i) => (
                  <li key={i}>{k}</li>
                ))}
              </ul>
            ) : (
              <Empty />
            )}
          </ResultCard>

          <ResultCard title="Top Complaints">
            <Bullets items={analysis?.complaints} />
          </ResultCard>

          <ResultCard title="Top Compliments">
            <Bullets items={analysis?.compliments} />
          </ResultCard>

          <ResultCard title="Most Common Questions">
            <Bullets items={analysis?.questions} />
          </ResultCard>

          <ResultCard title="Suggested Improvements">
            <Bullets items={analysis?.improvements} />
          </ResultCard>

          <ResultCard title="Recommended Actions" wide>
            <Bullets items={analysis?.actions} />
          </ResultCard>
        </div>
      </section>

      {lockOpen && (
        <div
          className="modal-backdrop"
          onClick={() => setLockOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Sign in"
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Accounts are coming soon</h2>
            <p>
              Sentiment tracking over time needs saved history, which arrives
              with accounts. Everything else works right now without signing
              in.
            </p>
            <button className="btn-grad" onClick={() => setLockOpen(false)}>
              Got it
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function ResultCard({ title, wide, children }) {
  return (
    <div className={`card result-card${wide ? " wide" : ""}`}>
      <h3>{title}</h3>
      {children}
    </div>
  );
}

function Empty() {
  return <p className="placeholder">Run an analysis to see results here</p>;
}

function Bullets({ items }) {
  if (!items?.length) return <Empty />;
  return (
    <ul className="plain">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}
