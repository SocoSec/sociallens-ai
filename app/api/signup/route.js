import bcrypt from "bcryptjs";
import { createUser, getUserByEmail, dbAvailable } from "@/lib/db";

export async function POST(req) {
  if (!dbAvailable()) {
    return Response.json(
      { error: "Accounts aren't set up yet: the database is missing. (Owner: create a Neon Postgres database in Vercel → Storage.)" },
      { status: 503 }
    );
  }
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  const name = String(body.name || "").trim().slice(0, 80);
  const email = String(body.email || "").toLowerCase().trim();
  const password = String(body.password || "");

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return Response.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (password.length < 8) {
    return Response.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  try {
    const existing = await getUserByEmail(email);
    if (existing) {
      return Response.json(
        { error: "An account with that email already exists. Try signing in instead." },
        { status: 409 }
      );
    }
    const passwordHash = await bcrypt.hash(password, 10);
    await createUser({ email, name: name || email.split("@")[0], passwordHash });
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message || "Could not create the account." }, { status: 500 });
  }
}
