import { cookies } from "next/headers";
import { adminCookieName, createAdminCookie } from "../../../lib/auth";
import { json } from "../../../lib/http";

export const runtime = "nodejs";

export async function POST(request) {
  const body = await request.json();
  const password = String(body.password || "");
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword || password !== adminPassword) {
    return json({ error: "パスワードが違います。" }, 401);
  }

  const cookieStore = await cookies();
  cookieStore.set(adminCookieName, createAdminCookie(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 86400,
  });

  return json({ ok: true });
}
