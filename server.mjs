import { createServer } from "node:http";
import { createHmac, timingSafeEqual } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname, join } from "node:path";

const root = new URL(".", import.meta.url).pathname;
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || "127.0.0.1";

await loadEnv();

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host}`);

    if (req.method === "POST" && url.pathname === "/api/login") {
      return handleLogin(req, res);
    }

    if (req.method === "POST" && url.pathname === "/api/logout") {
      return handleLogout(res);
    }

    if (req.method === "GET" && url.pathname === "/api/me") {
      return json(res, { authenticated: isAdmin(req) });
    }

    if (req.method === "GET" && url.pathname === "/api/staff") {
      return json(res, await getStaff());
    }

    if (req.method === "GET" && url.pathname === "/api/device") {
      return handleGetDevice(url, res);
    }

    if (req.method === "GET" && url.pathname === "/api/devices") {
      if (!isAdmin(req)) return json(res, { error: "Unauthorized" }, 401);
      return json(res, await getDevices());
    }

    if (req.method === "POST" && url.pathname === "/api/devices") {
      if (!isAdmin(req)) return json(res, { error: "Unauthorized" }, 401);
      return handleSaveDevice(req, res);
    }

    if (req.method === "POST" && url.pathname === "/api/staff") {
      if (!isAdmin(req)) return json(res, { error: "Unauthorized" }, 401);
      return handleSaveStaff(req, res);
    }

    if (req.method === "GET" && url.pathname === "/api/visits") {
      if (!isAdmin(req)) return json(res, { error: "Unauthorized" }, 401);
      return json(res, await getVisits());
    }

    if (req.method === "POST" && url.pathname === "/api/check-in") {
      return handleCheckIn(req, res);
    }

    if (req.method === "POST" && url.pathname === "/api/trial-lesson") {
      return handleTrialLesson(req, res);
    }

    if (req.method === "POST" && url.pathname === "/api/room-rental") {
      return handleRoomRental(req, res);
    }

    if (req.method === "GET") {
      const path = url.pathname === "/" ? "/index.html" : url.pathname;
      if (path === "/admin.html" && !isAdmin(req)) {
        res.writeHead(302, { Location: "/login.html" });
        res.end();
        return;
      }
      return serveStatic(path, res);
    }

    res.writeHead(405);
    res.end("Method Not Allowed");
  } catch (error) {
    console.error(error);
    json(res, { error: "Internal Server Error" }, 500);
  }
}).listen(port, host, () => {
  console.log(`Reception app running at http://${host === "0.0.0.0" ? "localhost" : host}:${port}`);
});

async function handleCheckIn(req, res) {
  const body = await readBody(req);
  const visitorName = String(body.visitorName || "").trim();
  const staffId = String(body.staffId || "").trim();
  const deviceKey = String(body.deviceKey || "").trim();

  if (!visitorName || !staffId) {
    return json(res, { error: "来訪者名と担当者を入力してください。" }, 400);
  }

  const device = await findDevice(deviceKey);
  if (!device) {
    return json(res, { error: "受付端末が登録されていません。管理画面で端末を登録してください。" }, 400);
  }

  const staff = (await getStaff()).find((item) => item.id === staffId && item.enabled);
  if (!staff) {
    return json(res, { error: "担当者が見つかりません。" }, 404);
  }

  const schoolName = device.schoolName;
  const deviceName = device.deviceName;
  const visit = {
    id: crypto.randomUUID(),
    visitorName,
    staffId,
    staffName: staff.name,
    schoolName,
    deviceName,
    status: "pending",
    createdAt: new Date().toISOString(),
    slackOk: false,
    slackError: null,
  };

  const message = `受付に来訪者があります。\n校舎: ${schoolName}\n端末: ${deviceName}\n来訪者: ${visitorName}様`;
  const slackResult = await sendSlackMessage(staff.slackUserId, message);
  visit.slackOk = slackResult.ok;
  visit.slackError = slackResult.error;

  await addVisit(visit);

  if (!slackResult.ok) {
    return json(res, { error: `Slack通知に失敗しました: ${slackResult.error}`, visit }, 502);
  }

  json(res, { ok: true, visit });
}

async function handleTrialLesson(req, res) {
  const body = await readBody(req);
  const visitorName = String(body.visitorName || "").trim();
  const deviceKey = String(body.deviceKey || "").trim();

  if (!visitorName) {
    return json(res, { error: "来訪者名を入力してください。" }, 400);
  }

  const device = await findDevice(deviceKey);
  if (!device) {
    return json(res, { error: "受付端末が登録されていません。管理画面で端末を登録してください。" }, 400);
  }

  const trialRecipients = await findTrialRecipients();
  if (!trialRecipients.length) {
    return json(res, { error: "体験レッスン通知先が設定されていません。" }, 400);
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
  };

  const message = `体験レッスン希望の来訪者があります。\n校舎: ${device.schoolName}\n端末: ${device.deviceName}\n来訪者: ${visitorName}様`;
  const slackResults = await Promise.all(
    trialRecipients.map((recipient) => sendSlackMessage(recipient.slackUserId, message)),
  );
  const failedResults = slackResults.filter((result) => !result.ok);
  visit.slackOk = failedResults.length === 0;
  visit.slackError = failedResults.map((result) => result.error).filter(Boolean).join(", ") || null;
  visit.trialRecipientCount = trialRecipients.length;

  await addVisit(visit);

  if (failedResults.length) {
    return json(res, { error: `Slack通知に失敗しました: ${visit.slackError}`, visit }, 502);
  }

  json(res, { ok: true, visit });
}

async function handleRoomRental(req, res) {
  const body = await readBody(req);
  const visitorName = String(body.visitorName || "").trim();
  const deviceKey = String(body.deviceKey || "").trim();

  if (!visitorName) {
    return json(res, { error: "来訪者名を入力してください。" }, 400);
  }

  const device = await findDevice(deviceKey);
  if (!device) {
    return json(res, { error: "受付端末が登録されていません。管理画面で端末を登録してください。" }, 400);
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
  json(res, { ok: true, visit });
}

async function handleGetDevice(url, res) {
  const deviceKey = String(url.searchParams.get("device") || "").trim();
  const device = await findDevice(deviceKey);

  if (!device) {
    return json(res, { error: "受付端末が登録されていません。" }, 404);
  }

  json(res, { device });
}

async function handleLogin(req, res) {
  const body = await readBody(req);
  const password = String(body.password || "");
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword || password !== adminPassword) {
    return json(res, { error: "パスワードが違います。" }, 401);
  }

  const value = `admin.${Date.now()}`;
  const cookie = `${value}.${sign(value)}`;
  res.writeHead(200, {
    "Content-Type": "application/json; charset=utf-8",
    "Set-Cookie": `admin_session=${cookie}; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400`,
  });
  res.end(JSON.stringify({ ok: true }));
}

function handleLogout(res) {
  res.writeHead(200, {
    "Content-Type": "application/json; charset=utf-8",
    "Set-Cookie": "admin_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0",
  });
  res.end(JSON.stringify({ ok: true }));
}

async function handleSaveStaff(req, res) {
  const body = await readBody(req);
  const id = String(body.id || "").trim();
  const name = String(body.name || "").trim();
  const searchKana = String(body.searchKana || "").trim();
  const slackUserId = String(body.slackUserId || "").trim();
  const imageUrl = String(body.imageUrl || "").trim();
  const enabled = Boolean(body.enabled);

  if (!name || !slackUserId) {
    return json(res, { error: "担当者名とSlackメンバーIDを入力してください。" }, 400);
  }

  if (!/^U[A-Z0-9]+$/i.test(slackUserId)) {
    return json(res, { error: "SlackメンバーIDは U で始まるIDを入力してください。" }, 400);
  }

  const nextStaff = {
    id: id || crypto.randomUUID(),
    name,
    searchKana,
    slackUserId,
    imageUrl,
    enabled,
  };

  await saveStaff(nextStaff);
  json(res, { ok: true, staff: nextStaff });
}

async function handleSaveDevice(req, res) {
  const body = await readBody(req);
  const id = String(body.id || "").trim();
  const deviceKey = normalizeDeviceKey(body.deviceKey);
  const schoolName = String(body.schoolName || "").trim();
  const deviceName = String(body.deviceName || "").trim();
  const logoUrl = String(body.logoUrl || "").trim();
  const supportPhoneNumber = String(body.supportPhoneNumber || "").trim();
  const trialLessonStaffIds = Array.isArray(body.trialLessonStaffIds)
    ? body.trialLessonStaffIds.map(String).filter(Boolean)
    : [];
  const enabled = Boolean(body.enabled);

  if (!deviceKey || !schoolName || !deviceName) {
    return json(res, { error: "端末キー、校舎名、端末名を入力してください。" }, 400);
  }

  if (!/^[a-z0-9-]+$/.test(deviceKey)) {
    return json(res, { error: "端末キーは半角英数字とハイフンだけで入力してください。" }, 400);
  }

  const devices = await getDevices();
  const duplicate = devices.find((item) => item.deviceKey === deviceKey && item.id !== id);
  if (duplicate) {
    return json(res, { error: "同じ端末キーがすでに登録されています。" }, 400);
  }

  const nextDevice = {
    id: id || crypto.randomUUID(),
    deviceKey,
    schoolName,
    deviceName,
    logoUrl,
    supportPhoneNumber,
    trialLessonStaffIds,
    enabled,
  };

  await saveDevice(nextDevice);
  json(res, { ok: true, device: nextDevice });
}

async function findDevice(deviceKey) {
  const normalizedKey = normalizeDeviceKey(deviceKey);
  if (!normalizedKey) return null;

  const devices = await getDevices();
  return devices.find((item) => item.deviceKey === normalizedKey && item.enabled) || null;
}

async function findTrialRecipients() {
  const configuredSlackUserIds = String(
    process.env.TRIAL_LESSON_SLACK_USER_IDS || process.env.TRIAL_LESSON_SLACK_USER_ID || "",
  )
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const staff = await getStaff();

  if (configuredSlackUserIds.length) {
    return [...new Set(configuredSlackUserIds)].map((slackUserId) => ({ slackUserId }));
  }

  const fallbackStaff = staff.find((item) => item.enabled && item.slackUserId);
  return fallbackStaff ? [{ slackUserId: fallbackStaff.slackUserId }] : [];
}

function normalizeDeviceKey(value) {
  return String(value || "").trim().toLowerCase();
}

async function sendSlackMessage(channel, text) {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token || token.includes("your-token")) {
    return { ok: false, error: "SLACK_BOT_TOKEN is not set" };
  }

  const response = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({ channel, text }),
  });

  const result = await response.json();
  return result.ok ? { ok: true, error: null } : { ok: false, error: result.error || "unknown_error" };
}

async function serveStatic(path, res) {
  const filePath = join(root, "public", path);
  if (!filePath.startsWith(join(root, "public")) || !existsSync(filePath)) {
    res.writeHead(404);
    res.end("Not Found");
    return;
  }

  const body = await readFile(filePath);
  res.writeHead(200, { "Content-Type": contentTypes[extname(filePath)] || "application/octet-stream" });
  res.end(body);
}

function isAdmin(req) {
  const cookie = getCookie(req.headers.cookie || "", "admin_session");
  if (!cookie) return false;

  const parts = cookie.split(".");
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

function getCookie(cookieHeader, name) {
  const cookies = cookieHeader.split(";").map((item) => item.trim());
  const target = cookies.find((item) => item.startsWith(`${name}=`));
  return target ? decodeURIComponent(target.slice(name.length + 1)) : "";
}

async function readJson(fileName) {
  return JSON.parse(await readFile(join(root, fileName), "utf8"));
}

async function writeJson(fileName, value) {
  await writeFile(join(root, fileName), JSON.stringify(value, null, 2));
}

async function getStaff() {
  if (hasSupabase()) {
    return (await supabaseSelect("staff", "order=name.asc")).map(fromStaffRow);
  }

  return readJson("staff.json");
}

async function saveStaff(staff) {
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

async function getDevices() {
  if (hasSupabase()) {
    return (await supabaseSelect("devices", "order=school_name.asc,device_name.asc")).map(fromDeviceRow);
  }

  return readJson("devices.json");
}

async function saveDevice(device) {
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

async function getVisits() {
  if (hasSupabase()) {
    return (await supabaseSelect("visits", "order=created_at.desc&limit=100")).map(fromVisitRow);
  }

  return readJson("visits.json");
}

async function addVisit(visit) {
  if (hasSupabase()) {
    await supabaseInsert("visits", toVisitRow(visit));
    return;
  }

  const items = await readJson("visits.json");
  items.unshift(visit);
  await writeJson("visits.json", items);
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
    slackUserId: row.slack_user_id,
    imageUrl: row.image_url || "",
    enabled: row.enabled,
  };
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

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 1_000_000) {
        req.destroy();
        reject(new Error("Request body too large"));
      }
    });
    req.on("end", () => resolve(data ? JSON.parse(data) : {}));
    req.on("error", reject);
  });
}

function json(res, body, status = 200) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
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
