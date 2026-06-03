import { json, requireAdmin } from "../../../lib/http";

export const runtime = "nodejs";

export async function GET() {
  return json({ authenticated: await requireAdmin() });
}
