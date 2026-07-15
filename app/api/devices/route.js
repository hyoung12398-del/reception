import { getDevices, normalizeDeviceKey, saveDevice } from "../../../lib/data";
import { json, requireAdmin } from "../../../lib/http";

export const runtime = "nodejs";

export async function GET() {
  if (!(await requireAdmin())) return json({ error: "Unauthorized" }, 401);
  return json(await getDevices());
}

export async function POST(request) {
  if (!(await requireAdmin())) return json({ error: "Unauthorized" }, 401);

  const body = await request.json();
  const id = String(body.id || "").trim();
  const deviceKey = normalizeDeviceKey(body.deviceKey);
  const schoolName = String(body.schoolName || "").trim();
  const deviceName = String(body.deviceName || "").trim();
  const logoUrl = String(body.logoUrl || "").trim();
  const supportPhoneNumber = String(body.supportPhoneNumber || "").trim();
  const staffButtonLabel = String(body.staffButtonLabel || "").trim();
  const trialLessonStaffIds = Array.isArray(body.trialLessonStaffIds)
    ? body.trialLessonStaffIds.map(String).filter(Boolean)
    : [];
  const showRoomRental = body.showRoomRental !== false;
  const showGroupLesson = body.showGroupLesson === true;
  const groupLessonButtonLabel = String(body.groupLessonButtonLabel || "").trim();
  const deviceThemeEnabled = body.deviceThemeEnabled === true;
  const themeOverrides = body.themeOverrides && typeof body.themeOverrides === "object" ? body.themeOverrides : {};
  const enabled = Boolean(body.enabled);

  if (!deviceKey || !schoolName || !deviceName) {
    return json({ error: "端末キー、校舎名、端末名を入力してください。" }, 400);
  }

  if (!/^[a-z0-9-]+$/.test(deviceKey)) {
    return json({ error: "端末キーは半角英数字とハイフンだけで入力してください。" }, 400);
  }

  const devices = await getDevices();
  const duplicate = devices.find((item) => item.deviceKey === deviceKey && item.id !== id);
  if (duplicate) {
    return json({ error: "同じ端末キーがすでに登録されています。" }, 400);
  }

  const device = {
    id: id || crypto.randomUUID(),
    deviceKey,
    schoolName,
    deviceName,
    logoUrl,
    supportPhoneNumber,
    trialLessonStaffIds,
    staffButtonLabel,
    showRoomRental,
    showGroupLesson,
    groupLessonButtonLabel,
    deviceThemeEnabled,
    themeOverrides,
    enabled,
  };

  try {
    await saveDevice(device);
    return json({ ok: true, device });
  } catch (error) {
    console.error(error);
    return json(
      {
        error:
          "端末設定を保存できませんでした。Supabaseの devices テーブルに必要なカラムが作成されているか確認してください。",
      },
      500,
    );
  }
}
