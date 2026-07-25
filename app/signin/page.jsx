"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [hasGoogle, setHasGoogle] = useState(false);

  useEffect(() => {
    fetch("/api/auth/providers")
      .then((r) => r.json())
      .then((p) => setHasGoogle(!!p?.google))
      .catch(() => {});
  }, []);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setBusy(false);
    if (res?.error) {
      setError("Wrong email or password. Please try again.");
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <main className="container auth-page">
      <div className="card auth-card">
        <h1>Sign in</h1>
        {hasGoogle && (
          <>
            <button
              className="btn-secondary google-btn"
              onClick={() => signIn("google", { callbackUrl: "/" })}
            >
              Continue with Google
            </button>
            <div className="divider">or</div>
          </>
        )}
        <form onSubmit={submit}>
          <label>
            Email
            <input
              type="email"
              className="url-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              className="url-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="btn-grad full" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="auth-alt">
          No account yet? <Link href="/signup">Sign up</Link>
        </p>
      </div>
    </main>
  );
}
