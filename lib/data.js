import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const defaultSettings = {
  brandName: "受付",
  logoUrl: "",
  backgroundColor: "#f6f4ef",
  surfaceColor: "#ffffff",
  textColor: "#1f2428",
  labelColor: "#667074",
  accentColor: "#16635b",
};

export async function getStaff() {
  if (hasSupabase()) {
    return (await supabaseSelect("staff", "order=name.asc")).map(fromStaffRow);
  }

  return readJson("staff.json");
}

export async function saveStaff(staff) {
  if (hasSupabase()) {
    await supabaseUpsert("staff", toStaffRow(staff));
    return;
  }

  const items = await readJson("staff.json");
  const index = items.findIndex((item) => item.id === staff.id);
  if (index >= 0) items[index] = staff;
  else items.push(staff);
  await writeJson("staff.json", items);
}

export async function getDevices() {
  if (hasSupabase()) {
    return (await supabaseSelect("devices", "order=school_name.asc,device_name.asc")).map(fromDeviceRow);
  }

  return readJson("devices.json");
}

export async function saveDevice(device) {
  if (hasSupabase()) {
    await supabaseUpsert("devices", toDeviceRow(device));
    return;
  }

  const items = await readJson("devices.json");
  const index = items.findIndex((item) => item.id === device.id);
  if (index >= 0) items[index] = device;
  else items.push(device);
  await writeJson("devices.json", items);
}

export async function findDevice(deviceKey) {
  const normalizedKey = normalizeDeviceKey(deviceKey);
  if (!normalizedKey) return null;

  const devices = await getDevices();
  return devices.find((item) => item.deviceKey === normalizedKey && item.enabled) || null;
}

export async function getVisits() {
  if (hasSupabase()) {
    return (await supabaseSelect("visits", "order=created_at.desc&limit=100")).map(fromVisitRow);
  }

  return readJson("visits.json");
}

export async function addVisit(visit) {
  if (hasSupabase()) {
    await supabaseInsert("visits", toVisitRow(visit));
    return;
  }

  const items = await readJson("visits.json");
  items.unshift(visit);
  await writeJson("visits.json", items);
}

export async function findTrialRecipients(device = null) {
  const staff = await getStaff();
  if (device?.trialLessonStaffIds?.length) {
    return staff
      .filter((item) => device.trialLessonStaffIds.includes(item.id) && item.enabled && item.slackUserId)
      .map((item) => ({ slackUserId: item.slackUserId }));
  }

  const configuredSlackUserIds = String(
    process.env.TRIAL_LESSON_SLACK_USER_IDS || process.env.TRIAL_LESSON_SLACK_USER_ID || "",
  )
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (configuredSlackUserIds.length) {
    return [...new Set(configuredSlackUserIds)].map((slackUserId) => ({ slackUserId }));
  }

  const fallbackStaff = staff.find((item) => item.enabled && item.slackUserId);
  return fallbackStaff ? [{ slackUserId: fallbackStaff.slackUserId }] : [];
}

export async function getSettings() {
  if (hasSupabase()) {
    try {
      const rows = await supabaseSelect("app_settings", "id=eq.default&limit=1");
      return rows[0] ? fromSettingsRow(rows[0]) : defaultSettings;
    } catch (error) {
      console.error(error);
      return defaultSettings;
    }
  }

  if (!existsSync(join(root, "settings.json"))) return defaultSettings;
  return { ...defaultSettings, ...(await readJson("settings.json")) };
}

export async function saveSettings(settings) {
  const nextSettings = {
    ...defaultSettings,
    brandName: String(settings.brandName || defaultSettings.brandName).trim() || defaultSettings.brandName,
    logoUrl: String(settings.logoUrl || "").trim(),
    backgroundColor: normalizeColor(settings.backgroundColor, defaultSettings.backgroundColor),
    surfaceColor: normalizeColor(settings.surfaceColor, defaultSettings.surfaceColor),
    textColor: normalizeColor(settings.textColor, defaultSettings.textColor),
    labelColor: normalizeColor(settings.labelColor, defaultSettings.labelColor),
    accentColor: normalizeColor(settings.accentColor, defaultSettings.accentColor),
  };

  if (hasSupabase()) {
    await supabaseUpsert("app_settings", toSettingsRow(nextSettings));
    return nextSettings;
  }

  await writeJson("settings.json", nextSettings);
  return nextSettings;
}

export function normalizeDeviceKey(value) {
  return String(value || "").trim().toLowerCase();
}

async function readJson(fileName) {
  return JSON.parse(await readFile(join(root, fileName), "utf8"));
}

async function writeJson(fileName, value) {
  await writeFile(join(root, fileName), JSON.stringify(value, null, 2));
}

function hasSupabase() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

async function supabaseSelect(table, query = "") {
  return supabaseRequest(table, { method: "GET", query });
}

async function supabaseInsert(table, row) {
  return supabaseRequest(table, { method: "POST", body: row });
}

async function supabaseUpsert(table, row) {
  return supabaseRequest(table, {
    method: "POST",
    query: "on_conflict=id",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: row,
  });
}

async function supabaseRequest(table, options = {}) {
  const baseUrl = new URL(process.env.SUPABASE_URL).origin;
  const url = new URL(`${baseUrl}/rest/v1/${table}`);
  if (options.query) {
    for (const part of options.query.split("&")) {
      const [key, value] = part.split("=");
      url.searchParams.append(key, value);
    }
  }

  const response = await fetch(url, {
    method: options.method || "GET",
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json; charset=utf-8",
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supabase ${table} ${response.status}: ${errorText}`);
  }

  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

function fromStaffRow(row) {
  return {
    id: row.id,
    name: row.name,
    searchKana: row.search_kana || "",
    slackUserId: row.slack_user_id,
    imageUrl: row.image_url || "",
    enabled: row.enabled,
  };
}

function toStaffRow(staff) {
  return {
    id: staff.id,
    name: staff.name,
    search_kana: staff.searchKana || null,
    slack_user_id: staff.slackUserId,
    image_url: staff.imageUrl || null,
    enabled: staff.enabled,
  };
}

function fromDeviceRow(row) {
  return {
    id: row.id,
    deviceKey: row.device_key,
    schoolName: row.school_name,
    deviceName: row.device_name,
    logoUrl: row.logo_url || "",
    supportPhoneNumber: row.support_phone_number || "",
    trialLessonStaffIds: row.trial_lesson_staff_ids || [],
    enabled: row.enabled,
  };
}

function toDeviceRow(device) {
  return {
    id: device.id,
    device_key: device.deviceKey,
    school_name: device.schoolName,
    device_name: device.deviceName,
    logo_url: device.logoUrl || null,
    support_phone_number: device.supportPhoneNumber || null,
    trial_lesson_staff_ids: device.trialLessonStaffIds || [],
    enabled: device.enabled,
  };
}

function fromVisitRow(row) {
  return {
    id: row.id,
    visitorName: row.visitor_name,
    staffId: row.staff_id,
    staffName: row.staff_name,
    schoolName: row.school_name,
    deviceName: row.device_name,
    status: row.status,
    type: row.type,
    createdAt: row.created_at,
    slackOk: row.slack_ok,
    slackError: row.slack_error,
    trialRecipientCount: row.trial_recipient_count,
  };
}

function toVisitRow(visit) {
  return {
    id: visit.id,
    visitor_name: visit.visitorName,
    staff_id: visit.staffId,
    staff_name: visit.staffName,
    school_name: visit.schoolName,
    device_name: visit.deviceName,
    status: visit.status,
    type: visit.type || "staff_call",
    created_at: visit.createdAt,
    slack_ok: visit.slackOk,
    slack_error: visit.slackError,
    trial_recipient_count: visit.trialRecipientCount || null,
  };
}

function fromSettingsRow(row) {
  return {
    brandName: row.brand_name,
    logoUrl: row.logo_url || "",
    backgroundColor: row.background_color,
    surfaceColor: row.surface_color,
    textColor: row.text_color,
    labelColor: row.label_color || defaultSettings.labelColor,
    accentColor: row.accent_color,
  };
}

function toSettingsRow(settings) {
  return {
    id: "default",
    brand_name: settings.brandName,
    logo_url: settings.logoUrl || null,
    background_color: settings.backgroundColor,
    surface_color: settings.surfaceColor,
    text_color: settings.textColor,
    label_color: settings.labelColor,
    accent_color: settings.accentColor,
    updated_at: new Date().toISOString(),
  };
}

function normalizeColor(value, fallback) {
  const color = String(value || "").trim();
  return /^#[0-9a-f]{6}$/i.test(color) ? color : fallback;
}
