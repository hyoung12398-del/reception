import { findDevice } from "../../../lib/data";
import { json } from "../../../lib/http";

export const runtime = "nodejs";

export async function GET(request) {
  const url = new URL(request.url);
  const device = await findDevice(url.searchParams.get("device"));

  if (!device) {
    return json({ error: "受付端末が登録されていません。" }, 404);
  }

  return json({ device });
}
