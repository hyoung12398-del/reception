import { cookies } from "next/headers";
import { adminCookieName, isAdminSession } from "./auth";

export function json(body, status = 200) {
  return Response.json(body, { status });
}

export async function requireAdmin() {
  const cookieStore = await cookies();
  return isAdminSession(cookieStore.get(adminCookieName)?.value);
}
