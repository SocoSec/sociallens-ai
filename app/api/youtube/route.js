export const maxDuration = 60;

const MAX_COMMENTS = 1000;

function extractVideoId(url) {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1).split("/")[0];
    if (u.hostname.endsWith("youtube.com")) {
      if (u.searchParams.get("v")) return u.searchParams.get("v");
      const parts = u.pathname.split("/").filter(Boolean);
      // /shorts/ID, /live/ID, /embed/ID
      if (["shorts", "live", "embed"].includes(parts[0]) && parts[1]) {
        return parts[1];
      }
    }
  } catch {
    /* fall through */
  }
  return null;
}

export async function GET(req) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "Server is missing YOUTUBE_API_KEY. Add it in Vercel → Settings → Environment Variables." },
      { status: 500 }
    );
  }

  const url = new URL(req.url).searchParams.get("url") || "";
  const videoId = extractVideoId(url);
  if (!videoId) {
    return Response.json(
      { error: "That doesn't look like a YouTube video link." },
      { status: 400 }
    );
  }

  try {
    // Fetch the video title for a nicer label.
    let title = "";
    const vRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`
    );
    if (vRes.ok) {
      const vData = await vRes.json();
      title = vData.items?.[0]?.snippet?.title || "";
    }

    const comments = [];
    let pageToken = "";
    while (comments.length < MAX_COMMENTS) {
      const params = new URLSearchParams({
        part: "snippet",
        videoId,
        maxResults: "100",
        textFormat: "plainText",
        order: "relevance",
        key: apiKey,
      });
      if (pageToken) params.set("pageToken", pageToken);

      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/commentThreads?${params}`
      );
      const data = await res.json();
      if (!res.ok) {
        const reason = data?.error?.errors?.[0]?.reason;
        const msg =
          reason === "commentsDisabled"
            ? "Comments are disabled on that video."
            : data?.error?.message || "YouTube API request failed.";
        return Response.json({ error: msg }, { status: 502 });
      }

      for (const item of data.items || []) {
        const text =
          item.snippet?.topLevelComment?.snippet?.textDisplay || "";
        if (text) comments.push(text);
        if (comments.length >= MAX_COMMENTS) break;
      }

      pageToken = data.nextPageToken;
      if (!pageToken) break;
    }

    if (!comments.length) {
      return Response.json(
        { error: "No comments found on that video." },
        { status: 404 }
      );
    }

    return Response.json({ comments, title });
  } catch {
    return Response.json(
      { error: "Could not reach YouTube. Please try again." },
      { status: 502 }
    );
  }
}
