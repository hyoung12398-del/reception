import { cookies } from "next/headers";
import { adminCookieName } from "../../../lib/auth";
import { json } from "../../../lib/http";

export const runtime = "nodejs";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set(adminCookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return json({ ok: true });
}
