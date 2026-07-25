export const metadata = { title: "Privacy Policy — SocialLens AI" };

export default function PrivacyPage() {
  return (
    <main className="container page">
      <h1>Privacy Policy</h1>
      <p>Last updated: July 2026</p>
      <h2>What we collect</h2>
      <p>
        The comments you submit are sent to our server only to run the
        analysis you requested. We do not store them after the analysis
        completes. Analysis results and history are stored in your own
        browser's local storage, not on our servers.
      </p>
      <h2>Third-party services</h2>
      <p>
        Analyses are processed by Anthropic's API. Comment imports use the
        official YouTube Data API and Meta Graph API. Each service handles
        data under its own terms.
      </p>
      <h2>Cookies</h2>
      <p>This site does not use tracking cookies or advertising.</p>
      <h2>Contact</h2>
      <p>Questions? Reach out via the About page.</p>
    </main>
  );
}
