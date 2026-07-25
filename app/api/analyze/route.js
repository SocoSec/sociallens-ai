export const maxDuration = 60; // allow up to 60s on Vercel

const MAX_COMMENTS = 1000;
const MAX_CHARS = 120000; // keep the request well within model limits

export async function POST(req) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "Server is missing ANTHROPIC_API_KEY. Add it in Vercel → Settings → Environment Variables." },
      { status: 500 }
    );
  }

  let comments;
  try {
    const body = await req.json();
    comments = body.comments;
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!Array.isArray(comments) || comments.length === 0) {
    return Response.json({ error: "No comments provided." }, { status: 400 });
  }

  // Trim to a manageable sample.
  const sample = [];
  let chars = 0;
  for (const c of comments.slice(0, MAX_COMMENTS)) {
    const line = String(c).slice(0, 500);
    if (chars + line.length > MAX_CHARS) break;
    sample.push(line);
    chars += line.length;
  }

  const prompt = `You are a social media analyst. Below are ${sample.length} audience comments (one per line, from a total of ${comments.length}).

Analyze them and respond with ONLY a JSON object — no markdown fences, no preamble — using exactly this shape:

{
  "summary": "3-5 sentence plain-language summary of what the audience is saying overall",
  "sentiment": { "positive": <int>, "neutral": <int>, "negative": <int> },  // percentages summing to 100
  "topics": [ { "name": "topic", "share": <int percent of comments touching it> }, ... up to 8 ],
  "keywords": [ "keyword", ... up to 12 ],
  "complaints": [ "recurring complaint phrased as a short sentence", ... up to 5 ],
  "compliments": [ "recurring compliment", ... up to 5 ],
  "questions": [ "question the audience keeps asking", ... up to 5 ],
  "improvements": [ "concrete improvement suggested or implied by the comments", ... up to 5 ],
  "actions": [ "specific recommended action for the creator, with reasoning", ... up to 5 ]
}

If a category has no genuine examples, return an empty array for it rather than inventing content.

COMMENTS:
${sample.join("\n")}`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      const msg = data?.error?.message || "The AI request failed.";
      return Response.json({ error: msg }, { status: 502 });
    }

    const text = (data.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n");

    const clean = text.replace(/```json|```/g, "").trim();
    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch {
      return Response.json(
        { error: "The AI returned an unexpected format. Please try again." },
        { status: 502 }
      );
    }

    // Normalize sentiment so the bar always sums to 100.
    const s = parsed.sentiment || {};
    const total =
      (s.positive || 0) + (s.neutral || 0) + (s.negative || 0) || 1;
    parsed.sentiment = {
      positive: Math.round(((s.positive || 0) / total) * 100),
      neutral: Math.round(((s.neutral || 0) / total) * 100),
      negative: Math.round(((s.negative || 0) / total) * 100),
    };

    return Response.json(parsed);
  } catch (e) {
    return Response.json(
      { error: "Could not reach the AI service. Please try again." },
      { status: 502 }
    );
  }
}
