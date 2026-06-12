import { addVisit, findDevice } from "../../../lib/data";
import { json } from "../../../lib/http";

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

  const visit = {
    id: crypto.randomUUID(),
    visitorName,
    staffId: null,
    staffName: "レッスン室レンタル",
    schoolName: device.schoolName,
    deviceName: device.deviceName,
    status: "logged",
    type: "room_rental",
    createdAt: new Date().toISOString(),
    slackOk: true,
    slackError: null,
  };

  await addVisit(visit);
  return json({ ok: true, visit });
}
