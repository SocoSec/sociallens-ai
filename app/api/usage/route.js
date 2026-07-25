import { auth } from "@/auth";
import { dbAvailable, countAnalysesToday } from "@/lib/db";
import { FREE_DAILY_LIMIT } from "@/lib/limits";

export async function GET() {
  const session = await auth().catch(() => null);
  if (!session?.user?.id) {
    return Response.json({ signedIn: false });
  }
  let used = 0;
  if (dbAvailable()) {
    try {
      used = await countAnalysesToday(Number(session.user.id));
    } catch {
      /* ignore */
    }
  }
  return Response.json({
    signedIn: true,
    name: session.user.name,
    image: session.user.image || null,
    used,
    limit: FREE_DAILY_LIMIT,
  });
}
