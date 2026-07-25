export const maxDuration = 60;

const MAX_COMMENTS = 1000;

export async function GET(req) {
  const token = process.env.FACEBOOK_ACCESS_TOKEN;
  if (!token) {
    return Response.json(
      {
        error:
          "Facebook fetching needs a Meta Graph API access token. Add FACEBOOK_ACCESS_TOKEN in Vercel → Settings → Environment Variables, or export the comments to CSV and use the Upload CSV tab.",
      },
      { status: 501 }
    );
  }

  const url = new URL(req.url).searchParams.get("url") || "";

  try {
    // Resolve the post/video/reel URL to a Graph object ID.
    const lookup = await fetch(
      `https://graph.facebook.com/v19.0/?id=${encodeURIComponent(url)}&fields=og_object{id}&access_token=${token}`
    );
    const lookupData = await lookup.json();
    const objectId = lookupData?.og_object?.id;
    if (!objectId) {
      return Response.json(
        { error: "Could not resolve that link. Make sure it's a public post your token can read." },
        { status: 400 }
      );
    }

    const comments = [];
    let next = `https://graph.facebook.com/v19.0/${objectId}/comments?fields=message&limit=100&access_token=${token}`;
    while (next && comments.length < MAX_COMMENTS) {
      const res = await fetch(next);
      const data = await res.json();
      if (!res.ok) {
        return Response.json(
          { error: data?.error?.message || "Facebook API request failed." },
          { status: 502 }
        );
      }
      for (const item of data.data || []) {
        if (item.message) comments.push(item.message);
        if (comments.length >= MAX_COMMENTS) break;
      }
      next = data.paging?.next || null;
    }

    if (!comments.length) {
      return Response.json(
        { error: "No comments found on that post." },
        { status: 404 }
      );
    }

    return Response.json({ comments, title: "Facebook post" });
  } catch {
    return Response.json(
      { error: "Could not reach Facebook. Please try again." },
      { status: 502 }
    );
  }
}
