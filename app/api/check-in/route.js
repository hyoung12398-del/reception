import { addVisit, findDevice, getStaff } from "../../../lib/data";
import { json } from "../../../lib/http";
import { sendSlackMessage } from "../../../lib/slack";

export const runtime = "nodejs";

export async function POST(request) {
  const body = await request.json();
  const visitorName = String(body.visitorName || "").trim();
  const staffId = String(body.staffId || "").trim();
  const deviceKey = String(body.deviceKey || "").trim();

  if (!visitorName || !staffId) {
    return json({ error: "来訪者名と担当者を入力してください。" }, 400);
  }

  const device = await findDevice(deviceKey);
  if (!device) {
    return json({ error: "受付端末が登録されていません。管理画面で端末を登録してください。" }, 400);
  }

  const staff = (await getStaff()).find((item) => item.id === staffId && item.enabled);
  if (!staff) {
    return json({ error: "担当者が見つかりません。" }, 404);
  }

  const visit = {
    id: crypto.randomUUID(),
    visitorName,
    staffId,
    staffName: staff.name,
    schoolName: device.schoolName,
    deviceName: device.deviceName,
    status: "pending",
    type: "staff_call",
    createdAt: new Date().toISOString(),
    slackOk: false,
    slackError: null,
  };

  const message = `受付に来訪者があります。\n校舎: ${device.schoolName}\n端末: ${device.deviceName}\n来訪者: ${visitorName}様`;
  const slackResult = await sendSlackMessage(staff.slackUserId, message);
  visit.slackOk = slackResult.ok;
  visit.slackError = slackResult.error;
  await addVisit(visit);

  if (!slackResult.ok) {
    return json({ error: `Slack通知に失敗しました: ${slackResult.error}`, visit }, 502);
  }

  return json({ ok: true, visit });
}
