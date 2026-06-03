import { createHmac, timingSafeEqual } from "node:crypto";

export const adminCookieName = "admin_session";

export function createAdminCookie() {
  const value = `admin.${Date.now()}`;
  return `${value}.${sign(value)}`;
}

export function isAdminSession(cookieValue) {
  if (!cookieValue) return false;

  const parts = cookieValue.split(".");
  if (parts.length < 3) return false;

  const signature = parts.pop();
  const value = parts.join(".");
  const expected = sign(value);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  return (
    signatureBuffer.length === expectedBuffer.length &&
    timingSafeEqual(signatureBuffer, expectedBuffer)
  );
}

function sign(value) {
  const secret = process.env.SESSION_SECRET || "local-dev-secret";
  return createHmac("sha256", secret).update(value).digest("hex");
}
