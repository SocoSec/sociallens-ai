export const metadata = { title: "Pricing — SocialLens AI" };

const TIERS = [
  {
    name: "Free",
    price: "$0",
    per: "forever",
    features: [
      "5 analyses per month",
      "Up to 200 comments per analysis",
      "Paste text or upload CSV",
      "Browser-only history",
    ],
  },
  {
    name: "Creator",
    price: "$12",
    per: "per month",
    featured: true,
    features: [
      "100 analyses per month",
      "Up to 1,000 comments per analysis",
      "YouTube & Facebook import",
      "Sentiment over time",
      "Priority processing",
    ],
  },
  {
    name: "Team",
    price: "$39",
    per: "per month",
    features: [
      "Unlimited analyses",
      "Up to 5,000 comments per analysis",
      "5 seats included",
      "Shared workspace history",
      "CSV & PDF export",
    ],
  },
];

export default function PricingPage() {
  return (
    <main className="container page" style={{ maxWidth: 1080 }}>
      <h1>Pricing</h1>
      <p>Start free. Upgrade when your comment sections outgrow you.</p>
      <div className="tiers">
        {TIERS.map((t) => (
          <div key={t.name} className={`card tier${t.featured ? " featured" : ""}`}>
            <h2 style={{ marginTop: 0 }}>{t.name}</h2>
            <div className="price">{t.price}</div>
            <div className="per">{t.per}</div>
            <ul>
              {t.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p style={{ marginTop: 24, fontSize: "0.85rem" }}>
        Note: payments aren't wired up yet in this build — see the README for
        how to connect Stripe.
      </p>
    </main>
  );
}
