import { getSettings, saveSettings } from "../../../lib/data";
import { json, requireAdmin } from "../../../lib/http";

export const runtime = "nodejs";

export async function GET() {
  return json(await getSettings());
}

export async function POST(request) {
  if (!(await requireAdmin())) return json({ error: "Unauthorized" }, 401);

  try {
    const settings = await saveSettings(await request.json());
    return json({ ok: true, settings });
  } catch (error) {
    console.error(error);
    return json(
      {
        error:
          "デザイン設定を保存できませんでした。Supabaseに app_settings テーブルが作成されているか確認してください。",
      },
      500,
    );
  }
}
