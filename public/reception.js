let selectedStaffId = "";
let staffList = [];
let deviceKey = "";
let currentDevice = null;
let mode = "";

const choiceGrid = document.querySelector("#choiceGrid");
const formArea = document.querySelector("#formArea");
const staffArea = document.querySelector("#staffArea");
const chooseStaff = document.querySelector("#chooseStaff");
const chooseTrial = document.querySelector("#chooseTrial");
const chooseRental = document.querySelector("#chooseRental");
const backButton = document.querySelector("#backButton");
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
  const staffResult = await requestJson("/api/staff", {}, 12000, currentDevice?.supportPhoneNumber);
  if (staffResult.ok) {
    staffList = staffResult.data.filter((item) => item.enabled);
  } else {
    message.textContent =
      staffResult.error || "担当者一覧を取得できませんでした。Wi-Fi接続を確認して、ページを再読み込みしてください。";
  }
  renderStaff([]);
  chooseStaff.addEventListener("click", () => chooseMode("staff"));
  chooseTrial.addEventListener("click", () => chooseMode("trial"));
  chooseRental.addEventListener("click", () => chooseMode("rental"));
  backButton.addEventListener("click", backToMenu);
  staffSearch.addEventListener("input", filterStaff);
  visitorName.addEventListener("input", updateButton);
  sendButton.addEventListener("click", sendCheckIn);
  trialButton.addEventListener("click", sendTrialLesson);
  rentalButton.addEventListener("click", saveRoomRental);
  updateModeView();
}

async function loadDevice() {
  if (!deviceKey) {
    deviceLabel.textContent = "端末未設定";
    message.textContent = "URLに ?device=端末キー を付けて開いてください。";
    return;
  }

  const result = await requestJson(`/api/device?device=${encodeURIComponent(deviceKey)}`, {}, 12000);
  if (!result.ok) {
    deviceLabel.textContent = "端末未登録";
    message.textContent = result.error || "端末情報を取得できませんでした。";
    updateModeView();
    return;
  }

  currentDevice = result.data.device;
  deviceLabel.textContent = `${currentDevice.schoolName} / ${currentDevice.deviceName}`;
  updateModeView();
}

function chooseMode(nextMode) {
  mode = nextMode;
  visitorName.value = "";
  selectedStaffId = "";
  staffSearch.value = "";
  renderStaff([]);
  message.textContent = "";
  updateModeView();
}

function backToMenu() {
  mode = "";
  visitorName.value = "";
  selectedStaffId = "";
  staffSearch.value = "";
  renderStaff([]);
  message.textContent = "";
  updateModeView();
}

function returnToMenuWithMessage(text) {
  mode = "";
  visitorName.value = "";
  selectedStaffId = "";
  staffSearch.value = "";
  renderStaff([]);
  updateModeView();
  message.textContent = text;
}

function updateModeView() {
  choiceGrid.classList.toggle("hidden", Boolean(mode));
  formArea.classList.toggle("hidden", !mode);
  staffArea.classList.toggle("hidden", mode !== "staff");
  sendButton.classList.toggle("hidden", mode !== "staff");
  trialButton.classList.toggle("hidden", mode !== "trial");
  rentalButton.classList.toggle("hidden", mode !== "rental");

  for (const button of [chooseStaff, chooseTrial, chooseRental]) {
    button.disabled = !currentDevice;
  }

  updateButton();
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

  const result = await requestJson(
    "/api/check-in",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        staffId: selectedStaffId,
        visitorName: visitorName.value,
        deviceKey,
      }),
    },
    15000,
    currentDevice?.supportPhoneNumber,
  );

  if (!result.ok) {
    message.textContent = result.error || "送信に失敗しました。";
    updateButton();
    return;
  }

  returnToMenuWithMessage("担当者へSlack通知を送信しました。");
}

async function sendTrialLesson() {
  message.textContent = "体験レッスン受付を通知しています...";
  sendButton.disabled = true;
  trialButton.disabled = true;

  const result = await requestJson(
    "/api/trial-lesson",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visitorName: visitorName.value,
        deviceKey,
      }),
    },
    15000,
    currentDevice?.supportPhoneNumber,
  );

  if (!result.ok) {
    message.textContent = result.error || "送信に失敗しました。";
    updateButton();
    return;
  }

  returnToMenuWithMessage("体験レッスン受付をSlack通知しました。");
}

async function saveRoomRental() {
  message.textContent = "レッスン室レンタルを記録しています...";
  sendButton.disabled = true;
  trialButton.disabled = true;
  rentalButton.disabled = true;

  const result = await requestJson(
    "/api/room-rental",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visitorName: visitorName.value,
        deviceKey,
      }),
    },
    15000,
    currentDevice?.supportPhoneNumber,
  );

  if (!result.ok) {
    message.textContent = result.error || "記録に失敗しました。";
    updateButton();
    return;
  }

  returnToMenuWithMessage("レッスン室レンタルを記録しました。");
}

function updateButton() {
  sendButton.disabled = mode !== "staff" || !currentDevice || !visitorName.value.trim() || !selectedStaffId;
  trialButton.disabled = mode !== "trial" || !currentDevice || !visitorName.value.trim();
  rentalButton.disabled = mode !== "rental" || !currentDevice || !visitorName.value.trim();
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

async function requestJson(url, options = {}, timeoutMs = 15000, supportPhoneNumber = "") {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const data = await safeJson(response);

    if (!response.ok) {
      return { ok: false, error: data.error || "サーバーで処理できませんでした。少し待ってからもう一度お試しください。" };
    }

    return { ok: true, data };
  } catch (error) {
    if (error.name === "AbortError") {
      return {
        ok: false,
        error: networkErrorMessage("通信に時間がかかっています。Wi-Fi接続を確認して、もう一度お試しください。", supportPhoneNumber),
      };
    }

    return {
      ok: false,
      error: networkErrorMessage("通信に失敗しました。Wi-Fi接続を確認して、もう一度お試しください。", supportPhoneNumber),
    };
  } finally {
    clearTimeout(timeout);
  }
}

function networkErrorMessage(baseMessage, supportPhoneNumber) {
  const phone = String(supportPhoneNumber || "").trim();
  if (!phone) return `${baseMessage}解決しない場合は受付スタッフまでお声がけください。`;

  return `${baseMessage}解決しない場合はこちらにお電話ください: ${phone}`;
}

async function safeJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}
