import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const sql = url ? neon(url) : null;
let ready;

export function dbAvailable() {
  return !!sql;
}

async function ensure() {
  if (!sql) {
    throw new Error(
      "Database not configured. Create a Neon Postgres database in Vercel → Storage and connect it to this project."
    );
  }
  if (!ready) {
    ready = (async () => {
      await sql`CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        image TEXT,
        password_hash TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
      )`;
      await sql`CREATE TABLE IF NOT EXISTS analyses (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        comment_count INTEGER,
        positive INTEGER,
        neutral INTEGER,
        negative INTEGER,
        summary TEXT,
        data JSONB,
        created_at TIMESTAMPTZ DEFAULT now()
      )`;
    })();
  }
  await ready;
}

export async function getUserByEmail(email) {
  await ensure();
  const rows = await sql`SELECT * FROM users WHERE email = ${email}`;
  return rows[0] || null;
}

export async function createUser({ email, name, passwordHash }) {
  await ensure();
  const rows = await sql`
    INSERT INTO users (email, name, password_hash)
    VALUES (${email}, ${name}, ${passwordHash})
    RETURNING id, email, name, image`;
  return rows[0];
}

export async function upsertOAuthUser({ email, name, image }) {
  await ensure();
  const rows = await sql`
    INSERT INTO users (email, name, image)
    VALUES (${email}, ${name}, ${image})
    ON CONFLICT (email) DO UPDATE SET
      name = COALESCE(EXCLUDED.name, users.name),
      image = COALESCE(EXCLUDED.image, users.image)
    RETURNING id, email, name, image`;
  return rows[0];
}

export async function saveAnalysis(userId, commentCount, analysis) {
  await ensure();
  const s = analysis.sentiment || {};
  await sql`
    INSERT INTO analyses (user_id, comment_count, positive, neutral, negative, summary, data)
    VALUES (${userId}, ${commentCount}, ${s.positive || 0}, ${s.neutral || 0},
            ${s.negative || 0}, ${analysis.summary || ""}, ${JSON.stringify(analysis)})`;
}

export async function getAnalyses(userId, limit = 25) {
  await ensure();
  return await sql`
    SELECT id, comment_count, positive, neutral, negative, summary, data, created_at
    FROM analyses WHERE user_id = ${userId}
    ORDER BY created_at DESC LIMIT ${limit}`;
}

export async function countAnalysesToday(userId) {
  await ensure();
  const rows = await sql`
    SELECT COUNT(*)::int AS n FROM analyses
    WHERE user_id = ${userId} AND created_at >= date_trunc('day', now())`;
  return rows[0]?.n || 0;
}
