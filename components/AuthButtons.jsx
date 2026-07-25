"use client";

import { useState } from "react";

export default function AuthButtons() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="btn-ghost" onClick={() => setOpen(true)}>
        Sign in
      </button>
      <button className="btn-grad" onClick={() => setOpen(true)}>
        Sign up
      </button>
      {open && (
        <div
          className="modal-backdrop"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Accounts"
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Accounts are coming soon</h2>
            <p>
              You don&apos;t need an account to analyze comments — everything on
              the home page works right now. Signing in will unlock saved
              history across devices and sentiment tracking over time.
            </p>
            <button className="btn-grad" onClick={() => setOpen(false)}>
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
