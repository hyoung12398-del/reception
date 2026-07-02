import { getStaff, saveStaff } from "../../../lib/data";
import { json, requireAdmin } from "../../../lib/http";

export const runtime = "nodejs";

export async function GET() {
  return json(await getStaff());
}

export async function POST(request) {
  try {
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
  } catch (error) {
    console.error(error);
    return json(
      {
        error: `担当者を保存できませんでした。Supabaseの staff テーブル設定を確認してください。詳細: ${formatStaffSaveError(error)}`,
      },
      500,
    );
  }
}

function formatStaffSaveError(error) {
  const message = String(error?.message || "不明なエラーです。");
  if (message.includes("search_kana")) return "staff テーブルに search_kana 列がありません。";
  if (message.includes("image_url")) return "staff テーブルに image_url 列がありません。";
  if (message.includes("slack_user_id")) return "staff テーブルに slack_user_id 列がありません。";
  if (message.includes("enabled")) return "staff テーブルに enabled 列がありません。";
  if (message.includes("Could not find the table")) return "staff テーブルが作成されていません。";
  if (message.includes("request timed out")) return "Supabaseへの通信がタイムアウトしました。";
  return message;
}
