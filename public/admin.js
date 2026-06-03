let staffItems = [];
let deviceItems = [];

const visits = document.querySelector("#visits");
const staffList = document.querySelector("#staffList");
const deviceList = document.querySelector("#deviceList");
const staffForm = document.querySelector("#staffForm");
const deviceForm = document.querySelector("#deviceForm");
const staffId = document.querySelector("#staffId");
const staffName = document.querySelector("#staffName");
const staffSlackUserId = document.querySelector("#staffSlackUserId");
const staffImageUrl = document.querySelector("#staffImageUrl");
const staffEnabled = document.querySelector("#staffEnabled");
const staffMessage = document.querySelector("#staffMessage");
const resetStaffForm = document.querySelector("#resetStaffForm");
const deviceId = document.querySelector("#deviceId");
const schoolName = document.querySelector("#schoolName");
const deviceName = document.querySelector("#deviceName");
const deviceKey = document.querySelector("#deviceKey");
const deviceEnabled = document.querySelector("#deviceEnabled");
const deviceMessage = document.querySelector("#deviceMessage");
const resetDeviceForm = document.querySelector("#resetDeviceForm");
const logoutButton = document.querySelector("#logoutButton");

main();

async function main() {
  await Promise.all([loadStaff(), loadDevices(), loadVisits()]);
  staffForm.addEventListener("submit", saveStaff);
  deviceForm.addEventListener("submit", saveDevice);
  resetStaffForm.addEventListener("click", clearStaffForm);
  resetDeviceForm.addEventListener("click", clearDeviceForm);
  logoutButton.addEventListener("click", logout);
}

async function loadStaff() {
  staffItems = await fetchJson("/api/staff");
  staffList.innerHTML = staffItems.length
    ? staffItems.map(renderStaff).join("")
    : `<p class="empty">担当者はまだ登録されていません。</p>`;

  for (const button of staffList.querySelectorAll("button")) {
    button.addEventListener("click", () => {
      const staff = staffItems.find((item) => item.id === button.dataset.id);
      if (staff) editStaff(staff);
    });
  }
}

async function loadDevices() {
  deviceItems = await fetchJson("/api/devices");
  deviceList.innerHTML = deviceItems.length
    ? deviceItems.map(renderDevice).join("")
    : `<p class="empty">端末はまだ登録されていません。</p>`;

  for (const button of deviceList.querySelectorAll("button")) {
    button.addEventListener("click", () => {
      const device = deviceItems.find((item) => item.id === button.dataset.id);
      if (device) editDevice(device);
    });
  }
}

async function loadVisits() {
  const items = await fetchJson("/api/visits");
  visits.innerHTML = items.length
    ? items.map(renderVisit).join("")
    : `<p class="empty">受付履歴はまだありません。</p>`;
}

function renderStaff(item) {
  return `
    <article class="admin-row">
      <div class="staff-admin-info">
        ${renderAvatar(item, "admin-avatar")}
        <div>
          <strong>${escapeHtml(item.name)}</strong>
          <p>${escapeHtml(item.slackUserId)}</p>
          ${item.imageUrl ? `<p>${escapeHtml(item.imageUrl)}</p>` : ""}
        </div>
      </div>
      <div class="row-actions">
        <span class="${item.enabled ? "badge ok" : "badge muted"}">${item.enabled ? "表示中" : "非表示"}</span>
        <button class="secondary small" data-id="${item.id}" type="button">編集</button>
      </div>
    </article>
  `;
}

function renderDevice(item) {
  const url = `${location.origin}/?device=${encodeURIComponent(item.deviceKey)}`;
  return `
    <article class="admin-row">
      <div>
        <strong>${escapeHtml(item.schoolName)} / ${escapeHtml(item.deviceName)}</strong>
        <p>${escapeHtml(item.deviceKey)}</p>
        <p><a class="text-link compact" href="${url}" target="_blank" rel="noreferrer">${escapeHtml(url)}</a></p>
      </div>
      <div class="row-actions">
        <span class="${item.enabled ? "badge ok" : "badge muted"}">${item.enabled ? "有効" : "無効"}</span>
        <button class="secondary small" data-id="${item.id}" type="button">編集</button>
      </div>
    </article>
  `;
}

function editStaff(item) {
  staffId.value = item.id;
  staffName.value = item.name;
  staffSlackUserId.value = item.slackUserId;
  staffImageUrl.value = item.imageUrl || "";
  staffEnabled.checked = item.enabled;
  staffMessage.textContent = `${item.name} を編集中です。`;
}

function editDevice(item) {
  deviceId.value = item.id;
  schoolName.value = item.schoolName;
  deviceName.value = item.deviceName;
  deviceKey.value = item.deviceKey;
  deviceEnabled.checked = item.enabled;
  deviceMessage.textContent = `${item.schoolName} / ${item.deviceName} を編集中です。`;
}

async function saveStaff(event) {
  event.preventDefault();
  staffMessage.textContent = "保存しています...";

  const response = await fetch("/api/staff", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: staffId.value,
      name: staffName.value,
      slackUserId: staffSlackUserId.value,
      imageUrl: staffImageUrl.value,
      enabled: staffEnabled.checked,
    }),
  });

  const result = await response.json();
  if (!response.ok) {
    staffMessage.textContent = result.error || "保存に失敗しました。";
    return;
  }

  clearStaffForm();
  staffMessage.textContent = "担当者を保存しました。";
  await loadStaff();
}

async function saveDevice(event) {
  event.preventDefault();
  deviceMessage.textContent = "保存しています...";

  const response = await fetch("/api/devices", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: deviceId.value,
      schoolName: schoolName.value,
      deviceName: deviceName.value,
      deviceKey: deviceKey.value,
      enabled: deviceEnabled.checked,
    }),
  });

  const result = await response.json();
  if (!response.ok) {
    deviceMessage.textContent = result.error || "保存に失敗しました。";
    return;
  }

  clearDeviceForm();
  deviceMessage.textContent = "端末を保存しました。";
  await loadDevices();
}

async function logout() {
  await fetch("/api/logout", { method: "POST" });
  location.href = "/login.html";
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  if (response.status === 401) {
    location.href = "/login.html";
    throw new Error("Unauthorized");
  }
  return response.json();
}

function clearStaffForm() {
  staffId.value = "";
  staffName.value = "";
  staffSlackUserId.value = "";
  staffImageUrl.value = "";
  staffEnabled.checked = true;
  staffMessage.textContent = "";
}

function clearDeviceForm() {
  deviceId.value = "";
  schoolName.value = "";
  deviceName.value = "";
  deviceKey.value = "";
  deviceEnabled.checked = true;
  deviceMessage.textContent = "";
}

function renderVisit(item) {
  const date = new Date(item.createdAt).toLocaleString("ja-JP");
  const status = item.slackOk ? "送信済み" : "送信失敗";
  const location = [item.schoolName, item.deviceName].filter(Boolean).join(" / ") || "校舎未設定";
  return `
    <article class="visit-row">
      <div>
        <strong>${escapeHtml(item.visitorName)}様</strong>
        <p>${escapeHtml(item.staffName)} / ${escapeHtml(location)} / ${date}</p>
      </div>
      <span class="${item.slackOk ? "badge ok" : "badge error"}">${status}</span>
    </article>
  `;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char];
  });
}

function renderAvatar(item, className) {
  if (item.imageUrl) {
    return `<img class="${className}" src="${escapeHtml(item.imageUrl)}" alt="" />`;
  }

  return `<span class="${className} avatar-fallback">${escapeHtml(item.name.slice(0, 1) || "?")}</span>`;
}
