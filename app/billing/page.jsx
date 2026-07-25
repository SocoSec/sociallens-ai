export const metadata = { title: "Billing — SocialLens AI" };

export default function BillingPage() {
  return (
    <main className="container page">
      <h1>Billing</h1>
      <p>
        You're on the <strong>Free</strong> plan: 5 analyses per day with a
        signed-in account, saved history, and sentiment tracking over time.
      </p>
      <p>
        Paid plans and payments aren't enabled in this build yet. To enable
        them, connect Stripe: create products for each plan, add a checkout
        API route, and store subscription state per user. The README includes
        a step-by-step outline.
      </p>
    </main>
  );
}
