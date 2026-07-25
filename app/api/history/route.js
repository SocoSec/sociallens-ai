import { auth } from "@/auth";
import { dbAvailable, getAnalyses } from "@/lib/db";

export async function GET() {
  const session = await auth().catch(() => null);
  if (!session?.user?.id) {
    return Response.json({ signedIn: false, analyses: [] });
  }
  if (!dbAvailable()) {
    return Response.json({ signedIn: true, analyses: [], error: "Database not configured." });
  }
  try {
    const analyses = await getAnalyses(Number(session.user.id));
    return Response.json({ signedIn: true, analyses });
  } catch (e) {
    return Response.json({ signedIn: true, analyses: [], error: e.message });
  }
}
