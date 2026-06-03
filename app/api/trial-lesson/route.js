import { addVisit, findDevice, findTrialRecipients } from "../../../lib/data";
import { json } from "../../../lib/http";
import { sendSlackMessage } from "../../../lib/slack";

export const runtime = "nodejs";

export async function POST(request) {
  const body = await request.json();
  const visitorName = String(body.visitorName || "").trim();
  const deviceKey = String(body.deviceKey || "").trim();

  if (!visitorName) {
    return json({ error: "来訪者名を入力してください。" }, 400);
  }

  const device = await findDevice(deviceKey);
  if (!device) {
    return json({ error: "受付端末が登録されていません。管理画面で端末を登録してください。" }, 400);
  }

  const trialRecipients = await findTrialRecipients();
  if (!trialRecipients.length) {
    return json({ error: "体験レッスン通知先が設定されていません。" }, 400);
  }

  const visit = {
    id: crypto.randomUUID(),
    visitorName,
    staffId: null,
    staffName: "体験レッスン",
    schoolName: device.schoolName,
    deviceName: device.deviceName,
    status: "pending",
    type: "trial_lesson",
    createdAt: new Date().toISOString(),
    slackOk: false,
    slackError: null,
    trialRecipientCount: trialRecipients.length,
  };

  const message = `体験レッスン希望の来訪者があります。\n校舎: ${device.schoolName}\n端末: ${device.deviceName}\n来訪者: ${visitorName}様`;
  const slackResults = await Promise.all(
    trialRecipients.map((recipient) => sendSlackMessage(recipient.slackUserId, message)),
  );
  const failedResults = slackResults.filter((result) => !result.ok);
  visit.slackOk = failedResults.length === 0;
  visit.slackError = failedResults.map((result) => result.error).filter(Boolean).join(", ") || null;
  await addVisit(visit);

  if (failedResults.length) {
    return json({ error: `Slack通知に失敗しました: ${visit.slackError}`, visit }, 502);
  }

  return json({ ok: true, visit });
}
