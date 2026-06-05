import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
await loadEnv();

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in .env.local");
}

await upsertMany("staff", (await readJson("staff.json")).map(toStaffRow));
await upsertMany("devices", (await readJson("devices.json")).map(toDeviceRow));
await upsertMany("visits", (await readJson("visits.json")).map(toVisitRow));
await upsertMany("app_settings", [toSettingsRow(await readOptionalJson("settings.json"))]);

console.log("Migrated staff, devices, and visits to Supabase.");

async function upsertMany(table, rows) {
  if (!rows.length) return;

  const baseUrl = new URL(process.env.SUPABASE_URL).origin;
  const response = await fetch(`${baseUrl}/rest/v1/${table}?on_conflict=id`, {
    method: "POST",
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json; charset=utf-8",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(rows),
  });

  if (!response.ok) {
    throw new Error(`${table} migration failed: ${response.status} ${await response.text()}`);
  }
}

async function readJson(fileName) {
  return JSON.parse(await readFile(join(root, fileName), "utf8"));
}

async function readOptionalJson(fileName) {
  try {
    return await readJson(fileName);
  } catch {
    return {};
  }
}

async function loadEnv() {
  const path = join(root, ".env.local");
  if (!existsSync(path)) return;

  const text = await readFile(path, "utf8");
  for (const line of text.split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].trim();
    }
  }
}

function toStaffRow(staff) {
  return {
    id: staff.id,
    name: staff.name,
    slack_user_id: staff.slackUserId,
    image_url: staff.imageUrl || null,
    enabled: staff.enabled,
  };
}

function toDeviceRow(device) {
  return {
    id: device.id,
    device_key: device.deviceKey,
    school_name: device.schoolName,
    device_name: device.deviceName,
    enabled: device.enabled,
  };
}

function toVisitRow(visit) {
  return {
    id: visit.id,
    visitor_name: visit.visitorName,
    staff_id: visit.staffId,
    staff_name: visit.staffName,
    school_name: visit.schoolName || "未設定校舎",
    device_name: visit.deviceName || "未設定端末",
    status: visit.status || "pending",
    type: visit.type || "staff_call",
    created_at: visit.createdAt,
    slack_ok: Boolean(visit.slackOk),
    slack_error: visit.slackError || null,
    trial_recipient_count: visit.trialRecipientCount || null,
  };
}

function toSettingsRow(settings = {}) {
  return {
    id: "default",
    brand_name: settings.brandName || "受付",
    logo_url: settings.logoUrl || null,
    background_color: settings.backgroundColor || "#f6f4ef",
    surface_color: settings.surfaceColor || "#ffffff",
    text_color: settings.textColor || "#1f2428",
    accent_color: settings.accentColor || "#16635b",
    updated_at: new Date().toISOString(),
  };
}
