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
        error: `デザイン設定を保存できませんでした。Supabaseの app_settings テーブル設定を確認してください。詳細: ${formatSettingsSaveError(error)}`,
      },
      500,
    );
  }
}

function formatSettingsSaveError(error) {
  const message = String(error?.message || "不明なエラーです。");
  const missingColumns = [
    "title_color",
    "device_label_color",
    "input_label_color",
    "primary_button_text_color",
    "outline_button_text_color",
    "quiet_button_text_color",
    "staff_button_background_color",
    "staff_button_text_color",
    "staff_button_border_color",
    "trial_button_background_color",
    "trial_button_text_color",
    "trial_button_border_color",
    "rental_button_background_color",
    "rental_button_text_color",
    "rental_button_border_color",
    "staff_card_text_color",
    "message_color",
  ].filter((column) => message.includes(column));

  if (missingColumns.length) return `app_settings テーブルに ${missingColumns.join(", ")} 列がありません。`;
  if (message.includes("Could not find the table")) return "app_settings テーブルが作成されていません。";
  if (message.includes("request timed out")) return "Supabaseへの通信がタイムアウトしました。";
  return message;
}
