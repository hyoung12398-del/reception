"use client";

import { useEffect, useState } from "react";

export default function ReceptionPage() {
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [staffList, setStaffList] = useState([]);
  const [filteredStaff, setFilteredStaff] = useState([]);
  const [deviceKey, setDeviceKey] = useState("");
  const [currentDevice, setCurrentDevice] = useState(null);
  const [deviceLabel, setDeviceLabel] = useState("端末を確認しています...");
  const [visitorName, setVisitorName] = useState("");
  const [staffSearch, setStaffSearch] = useState("");
  const [mode, setMode] = useState("");
  const [message, setMessage] = useState("");
  const [completionNotice, setCompletionNotice] = useState(null);
  const [sending, setSending] = useState(false);
  const [settings, setSettings] = useState(defaultSettings);

  useEffect(() => {
    const key = new URLSearchParams(location.search).get("device") || "";
    setDeviceKey(key);
    loadDevice(key);
    loadStaff();
    loadSettings();
  }, []);

  useEffect(() => {
    const query = normalizeText(staffSearch);
    const nextFilteredStaff = query
      ? staffList.filter((item) => {
          const searchableText = [item.name, item.searchKana].map(normalizeText).join(" ");
          return searchableText.includes(query);
        })
      : [];

    if (selectedStaffId && !nextFilteredStaff.some((item) => item.id === selectedStaffId)) {
      setSelectedStaffId("");
    }

    setFilteredStaff(nextFilteredStaff);
  }, [staffSearch, staffList, selectedStaffId]);

  useEffect(() => {
    if (!completionNotice) return undefined;

    const timer = setTimeout(() => {
      setCompletionNotice(null);
    }, 5000);

    return () => clearTimeout(timer);
  }, [completionNotice]);

  async function loadDevice(key) {
    if (!key) {
      setDeviceLabel("端末未設定");
      setMessage("URLに ?device=端末キー を付けて開いてください。");
      return;
    }

    const result = await requestJson(`/api/device?device=${encodeURIComponent(key)}`, {}, 12000);
    if (!result.ok) {
      setDeviceLabel("端末未登録");
      setMessage(result.error || "端末情報を取得できませんでした。");
      return;
    }

    setCurrentDevice(result.data.device);
    setDeviceLabel(`${result.data.device.schoolName} / ${result.data.device.deviceName}`);
  }

  async function loadStaff() {
    const result = await requestJson("/api/staff", {}, 12000, currentDevice?.supportPhoneNumber);
    if (result.ok) {
      setStaffList(result.data.filter((item) => item.enabled));
      return;
    }

    setMessage(result.error || "担当者一覧を取得できませんでした。Wi-Fi接続を確認して、ページを再読み込みしてください。");
  }

  async function loadSettings() {
    const result = await requestJson("/api/settings", {}, 12000);
    if (result.ok) {
      setSettings(result.data);
    }
  }

  async function sendCheckIn() {
    setMessage("通知を送信しています...");
    setSending(true);

    const result = await requestJson(
      "/api/check-in",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId: selectedStaffId,
          visitorName,
          deviceKey,
        }),
      },
      15000,
      currentDevice?.supportPhoneNumber,
    );

    setSending(false);
    if (!result.ok) {
      setMessage(result.error || "送信に失敗しました。");
      return;
    }

    resetForm();
    setMessage("担当者へSlack通知を送信しました。");
    showCompletionNotice();
  }

  async function sendTrialLesson() {
    setMessage("体験レッスン受付を通知しています...");
    setSending(true);

    const result = await requestJson(
      "/api/trial-lesson",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorName, deviceKey }),
      },
      15000,
      currentDevice?.supportPhoneNumber,
    );

    setSending(false);
    if (!result.ok) {
      setMessage(result.error || "送信に失敗しました。");
      return;
    }

    resetForm();
    setMessage("体験レッスン受付をSlack通知しました。");
    showCompletionNotice();
  }

  async function saveRoomRental() {
    setMessage("レッスン室レンタルを記録しています...");
    setSending(true);

    const result = await requestJson(
      "/api/room-rental",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorName, deviceKey }),
      },
      15000,
      currentDevice?.supportPhoneNumber,
    );

    setSending(false);
    if (!result.ok) {
      setMessage(result.error || "記録に失敗しました。");
      return;
    }

    resetForm();
    setMessage("レッスン室レンタルを記録しました。");
    showCompletionNotice();
  }

  async function saveGroupLesson() {
    setMessage("グループレッスン受付を記録しています...");
    setSending(true);

    const result = await requestJson(
      "/api/group-lesson",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorName, deviceKey }),
      },
      15000,
      currentDevice?.supportPhoneNumber,
    );

    setSending(false);
    if (!result.ok) {
      setMessage(result.error || "記録に失敗しました。");
      return;
    }

    resetForm();
    setMessage("グループレッスン受付を記録しました。");
    showCompletionNotice();
  }

  function resetForm() {
    setVisitorName("");
    setSelectedStaffId("");
    setStaffSearch("");
    setFilteredStaff([]);
    setMode("");
  }

  function chooseMode(nextMode) {
    setMode(nextMode);
    setVisitorName("");
    setSelectedStaffId("");
    setStaffSearch("");
    setFilteredStaff([]);
    setMessage("");
  }

  function backToMenu() {
    setMode("");
    setVisitorName("");
    setSelectedStaffId("");
    setStaffSearch("");
    setFilteredStaff([]);
    setMessage("");
  }

  function showCompletionNotice() {
    setCompletionNotice({ id: Date.now() });
  }

  const hasQuery = Boolean(normalizeText(staffSearch));
  const sendDisabled = sending || !currentDevice || !visitorName.trim() || !selectedStaffId;
  const trialDisabled = sending || !currentDevice || !visitorName.trim();
  const rentalDisabled = sending || !currentDevice || !visitorName.trim();
  const groupLessonDisabled = sending || !currentDevice || !visitorName.trim();
  const showRoomRental = currentDevice?.showRoomRental !== false;
  const staffButtonLabel = currentDevice?.staffButtonLabel || "担当講師の名前を検索する";
  const showGroupLesson = currentDevice?.showGroupLesson === true;
  const groupLessonButtonLabel = currentDevice?.groupLessonButtonLabel || "グループレッスン受付はこちら";
  const choiceCount = 2 + (showRoomRental ? 1 : 0) + (showGroupLesson ? 1 : 0);
  const choiceGridClass = `choice-grid ${choiceCount === 2 ? "two-choice" : ""} ${choiceCount >= 4 ? "four-choice" : ""}`;
  const activeSettings =
    currentDevice?.deviceThemeEnabled && currentDevice?.themeOverrides
      ? { ...settings, ...currentDevice.themeOverrides }
      : settings;
  const logoUrl = currentDevice?.logoUrl || activeSettings.logoUrl;
  const themeStyle = {
    "--bg": activeSettings.backgroundColor,
    "--surface": activeSettings.surfaceColor,
    "--surface-border": activeSettings.surfaceBorderColor,
    "--text": activeSettings.textColor,
    "--muted": activeSettings.labelColor,
    "--title": activeSettings.titleColor,
    "--device-label": activeSettings.deviceLabelColor,
    "--input-label": activeSettings.inputLabelColor,
    "--accent": activeSettings.accentColor,
    "--accent-strong": activeSettings.accentColor,
    "--primary-button-text": activeSettings.primaryButtonTextColor,
    "--outline-button-text": activeSettings.outlineButtonTextColor,
    "--quiet-button-text": activeSettings.quietButtonTextColor,
    "--staff-button-bg": activeSettings.staffButtonBackgroundColor,
    "--staff-button-text": activeSettings.staffButtonTextColor,
    "--staff-button-border": activeSettings.staffButtonBorderColor,
    "--trial-button-bg": activeSettings.trialButtonBackgroundColor,
    "--trial-button-text": activeSettings.trialButtonTextColor,
    "--trial-button-border": activeSettings.trialButtonBorderColor,
    "--rental-button-bg": activeSettings.rentalButtonBackgroundColor,
    "--rental-button-text": activeSettings.rentalButtonTextColor,
    "--rental-button-border": activeSettings.rentalButtonBorderColor,
    "--staff-card-text": activeSettings.staffCardTextColor,
    "--message": activeSettings.messageColor,
  };

  return (
    <div className="theme-root" style={themeStyle}>
      <main className="app-shell">
        <section className="topbar">
          <div className="brand-block">
            {logoUrl ? <img className="brand-logo" src={logoUrl} alt="" /> : null}
            <p className="eyebrow">Reception</p>
            <h1>{activeSettings.brandName || "受付"}</h1>
            <p className="device-label">{deviceLabel}</p>
          </div>
        </section>

        <section className="panel">
          {!mode ? (
            <div className={choiceGridClass}>
              <button className="choice-button" disabled={!currentDevice} onClick={() => chooseMode("staff")} type="button">
                {staffButtonLabel}
              </button>
              <button className="choice-button accent-outline" disabled={!currentDevice} onClick={() => chooseMode("trial")} type="button">
                体験レッスンはこちら
              </button>
              {showGroupLesson ? (
                <button className="choice-button quiet" disabled={!currentDevice} onClick={() => chooseMode("group")} type="button">
                  {groupLessonButtonLabel}
                </button>
              ) : null}
              {showRoomRental ? (
                <button className="choice-button quiet" disabled={!currentDevice} onClick={() => chooseMode("rental")} type="button">
                  レッスン室レンタルの生徒さんはこちら
                </button>
              ) : null}
            </div>
          ) : (
            <>
              <button className="back-button" onClick={backToMenu} type="button">
                戻る
              </button>

              {mode === "staff" && (
                <div>
                  <div className="section-title">{staffButtonLabel}</div>
                  <label className="search-field">
                    <span>先生の名前</span>
                    <input
                      autoComplete="off"
                      onChange={(event) => setStaffSearch(event.target.value)}
                      placeholder="名前で検索"
                      type="search"
                      value={staffSearch}
                    />
                  </label>
                  <div className="staff-grid">
                    {filteredStaff.map((item) => (
                      <button
                        className={`staff-card ${item.id === selectedStaffId ? "selected" : ""}`}
                        data-id={item.id}
                        key={item.id}
                        onClick={() => setSelectedStaffId(item.id)}
                        type="button"
                      >
                        <Avatar item={item} className="staff-avatar" />
                        <span>{item.name}</span>
                      </button>
                    ))}
                  </div>
                  {!filteredStaff.length && (
                    <p className="empty">
                      {hasQuery ? "該当する先生が見つかりません。" : "名前を入力すると先生が表示されます。"}
                    </p>
                  )}
                </div>
              )}

              <label className="field">
                <span>来訪者の名前</span>
                <input
                  autoComplete="name"
                  onChange={(event) => setVisitorName(event.target.value)}
                  placeholder="例：山田 太郎"
                  type="text"
                  value={visitorName}
                />
              </label>

              {mode === "staff" && (
                <button className="primary" disabled={sendDisabled} onClick={sendCheckIn} type="button">
                  呼び出す
                </button>
              )}
              {mode === "trial" && (
                <button className="trial-button" disabled={trialDisabled} onClick={sendTrialLesson} type="button">
                  体験レッスン受付
                </button>
              )}
              {mode === "rental" && (
                <button className="secondary-action" disabled={rentalDisabled} onClick={saveRoomRental} type="button">
                  レッスン室レンタルを記録
                </button>
              )}
              {mode === "group" && (
                <button className="secondary-action" disabled={groupLessonDisabled} onClick={saveGroupLesson} type="button">
                  グループレッスン受付を記録
                </button>
              )}
            </>
          )}
          <p className="message" aria-live="polite">
            {message}
          </p>
        </section>
      </main>
      {completionNotice ? (
        <div className="completion-overlay" role="status" aria-live="polite">
          <div className="completion-dialog">
            <p>受付は完了しました。</p>
            <p>待合室にてお待ちください。</p>
            <button className="completion-close" onClick={() => setCompletionNotice(null)} type="button">
              閉じる
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Avatar({ item, className }) {
  if (item.imageUrl) {
    return <img className={className} src={item.imageUrl} alt="" />;
  }

  return <span className={`${className} avatar-fallback`}>{item.name.slice(0, 1) || "?"}</span>;
}

function normalizeText(value) {
  return toKatakana(String(value).normalize("NFKC").trim().toLocaleLowerCase("ja-JP"));
}

function toKatakana(value) {
  return value.replace(/[\u3041-\u3096]/g, (char) => String.fromCharCode(char.charCodeAt(0) + 0x60));
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

const defaultSettings = {
  brandName: "受付",
  logoUrl: "",
  backgroundColor: "#f6f4ef",
  surfaceColor: "#ffffff",
  surfaceBorderColor: "#d9ded9",
  textColor: "#1f2428",
  labelColor: "#667074",
  titleColor: "#1f2428",
  deviceLabelColor: "#667074",
  inputLabelColor: "#667074",
  accentColor: "#16635b",
  primaryButtonTextColor: "#ffffff",
  outlineButtonTextColor: "#0f4842",
  quietButtonTextColor: "#1f2428",
  staffButtonBackgroundColor: "#16635b",
  staffButtonTextColor: "#ffffff",
  staffButtonBorderColor: "#16635b",
  trialButtonBackgroundColor: "#ffffff",
  trialButtonTextColor: "#0f4842",
  trialButtonBorderColor: "#16635b",
  rentalButtonBackgroundColor: "#eef0ee",
  rentalButtonTextColor: "#1f2428",
  rentalButtonBorderColor: "#d9ded9",
  staffCardTextColor: "#1f2428",
  messageColor: "#0f4842",
};
