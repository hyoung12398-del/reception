import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminCookieName, isAdminSession } from "../../lib/auth";
import AdminClient from "./AdminClient";

export const runtime = "nodejs";

export default async function AdminPage() {
  const cookieStore = await cookies();
  if (!isAdminSession(cookieStore.get(adminCookieName)?.value)) {
    redirect("/login");
  }

  return <AdminClient />;
}
