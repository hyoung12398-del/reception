let selectedStaffId = "";
let staffList = [];
let deviceKey = "";
let currentDevice = null;

const staffGrid = document.querySelector("#staffGrid");
const staffSearch = document.querySelector("#staffSearch");
const emptyStaff = document.querySelector("#emptyStaff");
const visitorName = document.querySelector("#visitorName");
const sendButton = document.querySelector("#sendButton");
const trialButton = document.querySelector("#trialButton");
const rentalButton = document.querySelector("#rentalButton");
const message = document.querySelector("#message");
const deviceLabel = document.querySelector("#deviceLabel");

main();

async function main() {
  deviceKey = new URLSearchParams(location.search).get("device") || "";
  await loadDevice();
  const staff = await fetch("/api/staff").then((res) => res.json());
  staffList = staff.filter((item) => item.enabled);
  renderStaff([]);
  staffSearch.addEventListener("input", filterStaff);
  visitorName.addEventListener("input", updateButton);
  sendButton.addEventListener("click", sendCheckIn);
  trialButton.addEventListener("click", sendTrialLesson);
  rentalButton.addEventListener("click", saveRoomRental);
}

async function loadDevice() {
  if (!deviceKey) {
    deviceLabel.textContent = "端末未設定";
    message.textContent = "URLに ?device=端末キー を付けて開いてください。";
    return;
  }

  const response = await fetch(`/api/device?device=${encodeURIComponent(deviceKey)}`);
  const result = await response.json();
  if (!response.ok) {
    deviceLabel.textContent = "端末未登録";
    message.textContent = result.error || "端末情報を取得できませんでした。";
    return;
  }

  currentDevice = result.device;
  deviceLabel.textContent = `${currentDevice.schoolName} / ${currentDevice.deviceName}`;
}

function filterStaff() {
  const query = normalizeText(staffSearch.value);
  const filteredStaff = query
    ? staffList.filter((item) => {
        const searchableText = [item.name, item.searchKana].map(normalizeText).join(" ");
        return searchableText.includes(query);
      })
    : [];

  if (selectedStaffId && !filteredStaff.some((item) => item.id === selectedStaffId)) {
    selectedStaffId = "";
  }

  renderStaff(filteredStaff);
  updateButton();
}

function renderStaff(staff) {
  const hasQuery = Boolean(normalizeText(staffSearch.value));
  emptyStaff.textContent = hasQuery
    ? "該当する先生が見つかりません。"
    : "名前を入力すると先生が表示されます。";
  emptyStaff.classList.toggle("hidden", staff.length > 0);
  staffGrid.innerHTML = staff
    .map(
      (item) => `
        <button class="staff-card ${item.id === selectedStaffId ? "selected" : ""}" data-id="${item.id}" type="button">
          ${renderAvatar(item)}
          <span>${escapeHtml(item.name)}</span>
        </button>
      `,
    )
    .join("");

  for (const button of staffGrid.querySelectorAll("button")) {
    button.addEventListener("click", () => {
      selectedStaffId = button.dataset.id;
      for (const card of staffGrid.querySelectorAll("button")) card.classList.remove("selected");
      button.classList.add("selected");
      updateButton();
    });
  }
}

async function sendCheckIn() {
  message.textContent = "通知を送信しています...";
  sendButton.disabled = true;

  const response = await fetch("/api/check-in", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      staffId: selectedStaffId,
      visitorName: visitorName.value,
      deviceKey,
    }),
  });

  const result = await response.json();
  if (!response.ok) {
    message.textContent = result.error || "送信に失敗しました。";
    updateButton();
    return;
  }

  visitorName.value = "";
  selectedStaffId = "";
  staffSearch.value = "";
  renderStaff([]);
  for (const card of staffGrid.querySelectorAll("button")) card.classList.remove("selected");
  message.textContent = "担当者へSlack通知を送信しました。";
  updateButton();
}

async function sendTrialLesson() {
  message.textContent = "体験レッスン受付を通知しています...";
  sendButton.disabled = true;
  trialButton.disabled = true;

  const response = await fetch("/api/trial-lesson", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      visitorName: visitorName.value,
      deviceKey,
    }),
  });

  const result = await response.json();
  if (!response.ok) {
    message.textContent = result.error || "送信に失敗しました。";
    updateButton();
    return;
  }

  visitorName.value = "";
  selectedStaffId = "";
  staffSearch.value = "";
  renderStaff([]);
  message.textContent = "体験レッスン受付をSlack通知しました。";
  updateButton();
}

async function saveRoomRental() {
  message.textContent = "レッスン室レンタルを記録しています...";
  sendButton.disabled = true;
  trialButton.disabled = true;
  rentalButton.disabled = true;

  const response = await fetch("/api/room-rental", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      visitorName: visitorName.value,
      deviceKey,
    }),
  });

  const result = await response.json();
  if (!response.ok) {
    message.textContent = result.error || "記録に失敗しました。";
    updateButton();
    return;
  }

  visitorName.value = "";
  selectedStaffId = "";
  staffSearch.value = "";
  renderStaff([]);
  message.textContent = "レッスン室レンタルを記録しました。";
  updateButton();
}

function updateButton() {
  sendButton.disabled = !currentDevice || !visitorName.value.trim() || !selectedStaffId;
  trialButton.disabled = !currentDevice || !visitorName.value.trim();
  rentalButton.disabled = !currentDevice || !visitorName.value.trim();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char];
  });
}

function renderAvatar(item) {
  if (item.imageUrl) {
    return `<img class="staff-avatar" src="${escapeHtml(item.imageUrl)}" alt="" />`;
  }

  return `<span class="staff-avatar avatar-fallback">${escapeHtml(item.name.slice(0, 1) || "?")}</span>`;
}

function normalizeText(value) {
  return String(value).trim().toLocaleLowerCase("ja-JP");
}
