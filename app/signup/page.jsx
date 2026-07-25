"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
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
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sign up failed.");
      const login = await signIn("credentials", { email, password, redirect: false });
      if (login?.error) throw new Error("Account created — please sign in.");
      router.push("/");
      router.refresh();
    } catch (e2) {
      setError(e2.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="container auth-page">
      <div className="card auth-card">
        <h1>Create your account</h1>
        <p className="auth-sub">
          Unlock saved history and sentiment tracking over time. 5 free
          analyses per day.
        </p>
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
            Name
            <input
              className="url-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </label>
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
            Password (8+ characters)
            <input
              type="password"
              className="url-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="btn-grad full" disabled={busy}>
            {busy ? "Creating account…" : "Sign up"}
          </button>
        </form>
        <p className="auth-alt">
          Already have an account? <Link href="/signin">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
