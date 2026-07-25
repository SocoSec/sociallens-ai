export const metadata = { title: "About — SocialLens AI" };

export default function AboutPage() {
  return (
    <main className="container page">
      <h1>About SocialLens AI</h1>
      <p>
        Comment sections hold the most honest feedback you'll ever get — and
        the least readable. SocialLens AI reads them for you: paste a link or
        raw comments, and get a clear picture of what your audience loves,
        what frustrates them, what they keep asking, and what to do next.
      </p>
      <h2>How it works</h2>
      <p>
        Comments are gathered from your paste, CSV, or the platform's official
        API, then analyzed by Claude (Anthropic's AI model) to produce a
        summary, sentiment split, topics, keywords, and recommended actions.
      </p>
      <h2>Privacy first</h2>
      <p>
        Analyses run on demand and results are stored only in your browser.
        See our Privacy Policy for details.
      </p>
    </main>
  );
}
