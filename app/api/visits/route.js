import { getVisits } from "../../../lib/data";
import { json, requireAdmin } from "../../../lib/http";

export const runtime = "nodejs";

export async function GET() {
  if (!(await requireAdmin())) return json({ error: "Unauthorized" }, 401);
  return json(await getVisits());
}
