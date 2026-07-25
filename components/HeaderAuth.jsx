"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function HeaderAuth() {
  const { status } = useSession();
  const [usage, setUsage] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const refresh = useCallback(() => {
    fetch("/api/usage")
      .then((r) => r.json())
      .then(setUsage)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (status === "authenticated") refresh();
    const onDone = () => refresh();
    window.addEventListener("analysis-done", onDone);
    return () => window.removeEventListener("analysis-done", onDone);
  }, [status, refresh]);

  if (status === "loading") return null;

  if (status !== "authenticated") {
    return (
      <>
        <Link href="/signin" className="btn-ghost">
          Sign in
        </Link>
        <Link href="/signup" className="btn-grad">
          Sign up
        </Link>
      </>
    );
  }

  const initial = (usage?.name || "U").charAt(0).toUpperCase();

  return (
    <div className="user-area">
      {usage?.used != null && (
        <span className="usage-chip">
          Free · {usage.used}/{usage.limit} today
        </span>
      )}
      <button
        className="avatar-btn"
        onClick={() => setMenuOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
      >
        {usage?.image ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={usage.image} alt="" className="avatar-img" />
        ) : (
          initial
        )}
      </button>
      {menuOpen && (
        <div className="user-menu" role="menu">
          <div className="user-menu-name">{usage?.name || "Account"}</div>
          <Link href="/history" role="menuitem" onClick={() => setMenuOpen(false)}>
            History
          </Link>
          <button role="menuitem" onClick={() => signOut({ callbackUrl: "/" })}>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
