import { getStaff, saveStaff } from "../../../lib/data";
import { json, requireAdmin } from "../../../lib/http";

export const runtime = "nodejs";

export async function GET() {
  return json(await getStaff());
}

export async function POST(request) {
  if (!(await requireAdmin())) return json({ error: "Unauthorized" }, 401);

  const body = await request.json();
  const id = String(body.id || "").trim();
  const name = String(body.name || "").trim();
  const searchKana = String(body.searchKana || "").trim();
  const slackUserId = String(body.slackUserId || "").trim();
  const imageUrl = String(body.imageUrl || "").trim();
  const enabled = Boolean(body.enabled);

  if (!name || !slackUserId) {
    return json({ error: "担当者名とSlackメンバーIDを入力してください。" }, 400);
  }

  if (!/^U[A-Z0-9]+$/i.test(slackUserId)) {
    return json({ error: "SlackメンバーIDは U で始まるIDを入力してください。" }, 400);
  }

  const staff = {
    id: id || crypto.randomUUID(),
    name,
    searchKana,
    slackUserId,
    imageUrl,
    enabled,
  };

  await saveStaff(staff);
  return json({ ok: true, staff });
}
