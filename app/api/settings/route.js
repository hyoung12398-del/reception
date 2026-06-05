import { getSettings, saveSettings } from "../../../lib/data";
import { json, requireAdmin } from "../../../lib/http";

export const runtime = "nodejs";

export async function GET() {
  return json(await getSettings());
}

export async function POST(request) {
  if (!(await requireAdmin())) return json({ error: "Unauthorized" }, 401);

  const settings = await saveSettings(await request.json());
  return json({ ok: true, settings });
}
