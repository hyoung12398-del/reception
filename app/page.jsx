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
  const [message, setMessage] = useState("");
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
      ? staffList.filter((item) => normalizeText(item.name).includes(query))
      : [];

    if (selectedStaffId && !nextFilteredStaff.some((item) => item.id === selectedStaffId)) {
      setSelectedStaffId("");
    }

    setFilteredStaff(nextFilteredStaff);
  }, [staffSearch, staffList, selectedStaffId]);

  async function loadDevice(key) {
    if (!key) {
      setDeviceLabel("端末未設定");
      setMessage("URLに ?device=端末キー を付けて開いてください。");
      return;
    }

    const response = await fetch(`/api/device?device=${encodeURIComponent(key)}`);
    const result = await response.json();
    if (!response.ok) {
      setDeviceLabel("端末未登録");
      setMessage(result.error || "端末情報を取得できませんでした。");
      return;
    }

    setCurrentDevice(result.device);
    setDeviceLabel(`${result.device.schoolName} / ${result.device.deviceName}`);
  }

  async function loadStaff() {
    const staff = await fetch("/api/staff").then((res) => res.json());
    setStaffList(staff.filter((item) => item.enabled));
  }

  async function loadSettings() {
    const response = await fetch("/api/settings");
    if (response.ok) {
      setSettings(await response.json());
    }
  }

  async function sendCheckIn() {
    setMessage("通知を送信しています...");
    setSending(true);

    const response = await fetch("/api/check-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        staffId: selectedStaffId,
        visitorName,
        deviceKey,
      }),
    });

    const result = await response.json();
    setSending(false);
    if (!response.ok) {
      setMessage(result.error || "送信に失敗しました。");
      return;
    }

    resetForm();
    setMessage("担当者へSlack通知を送信しました。");
  }

  async function sendTrialLesson() {
    setMessage("体験レッスン受付を通知しています...");
    setSending(true);

    const response = await fetch("/api/trial-lesson", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorName, deviceKey }),
    });

    const result = await response.json();
    setSending(false);
    if (!response.ok) {
      setMessage(result.error || "送信に失敗しました。");
      return;
    }

    resetForm();
    setMessage("体験レッスン受付をSlack通知しました。");
  }

  function resetForm() {
    setVisitorName("");
    setSelectedStaffId("");
    setStaffSearch("");
    setFilteredStaff([]);
  }

  const hasQuery = Boolean(normalizeText(staffSearch));
  const sendDisabled = sending || !currentDevice || !visitorName.trim() || !selectedStaffId;
  const trialDisabled = sending || !currentDevice || !visitorName.trim();
  const themeStyle = {
    "--bg": settings.backgroundColor,
    "--surface": settings.surfaceColor,
    "--text": settings.textColor,
    "--accent": settings.accentColor,
    "--accent-strong": settings.accentColor,
  };

  return (
    <main className="app-shell" style={themeStyle}>
      <section className="topbar">
        <div className="brand-block">
          {settings.logoUrl ? <img className="brand-logo" src={settings.logoUrl} alt="" /> : null}
          <p className="eyebrow">Reception</p>
          <h1>{settings.brandName || "受付"}</h1>
          <p className="device-label">{deviceLabel}</p>
        </div>
      </section>

      <section className="panel">
        <label className="field">
          <span>来訪者名</span>
          <input
            autoComplete="name"
            onChange={(event) => setVisitorName(event.target.value)}
            placeholder="例：山田 太郎"
            type="text"
            value={visitorName}
          />
        </label>

        <div>
          <div className="section-title">担当者を選択</div>
          <label className="search-field">
            <span>先生を検索</span>
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

        <button className="primary" disabled={sendDisabled} onClick={sendCheckIn} type="button">
          呼び出す
        </button>
        <button className="trial-button" disabled={trialDisabled} onClick={sendTrialLesson} type="button">
          体験レッスンはこちら
        </button>
        <p className="message" aria-live="polite">
          {message}
        </p>
      </section>
    </main>
  );
}

function Avatar({ item, className }) {
  if (item.imageUrl) {
    return <img className={className} src={item.imageUrl} alt="" />;
  }

  return <span className={`${className} avatar-fallback`}>{item.name.slice(0, 1) || "?"}</span>;
}

function normalizeText(value) {
  return String(value).trim().toLocaleLowerCase("ja-JP");
}

const defaultSettings = {
  brandName: "受付",
  logoUrl: "",
  backgroundColor: "#f6f4ef",
  surfaceColor: "#ffffff",
  textColor: "#1f2428",
  accentColor: "#16635b",
};
