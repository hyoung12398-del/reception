"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function AdminClient() {
  const [staffItems, setStaffItems] = useState([]);
  const [deviceItems, setDeviceItems] = useState([]);
  const [visits, setVisits] = useState([]);
  const [staffForm, setStaffForm] = useState(emptyStaffForm());
  const [deviceForm, setDeviceForm] = useState(emptyDeviceForm());
  const [staffMessage, setStaffMessage] = useState("");
  const [deviceMessage, setDeviceMessage] = useState("");
  const [settingsForm, setSettingsForm] = useState(emptySettingsForm());
  const [settingsMessage, setSettingsMessage] = useState("");

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    await Promise.all([loadStaff(), loadDevices(), loadVisits(), loadSettings()]);
  }

  async function loadStaff() {
    setStaffItems(await fetchJson("/api/staff"));
  }

  async function loadDevices() {
    setDeviceItems(await fetchJson("/api/devices"));
  }

  async function loadVisits() {
    setVisits(await fetchJson("/api/visits"));
  }

  async function loadSettings() {
    setSettingsForm(await fetchJson("/api/settings"));
  }

  async function saveStaff(event) {
    event.preventDefault();
    setStaffMessage("保存しています...");

    try {
      const { response, result } = await postJson("/api/staff", staffForm);
      if (!response.ok) {
        setStaffMessage(result.error || "保存に失敗しました。");
        return;
      }

      setStaffForm(emptyStaffForm());
      setStaffMessage("担当者を保存しました。");
      await loadStaff();
    } catch (error) {
      setStaffMessage(error.message || "保存に失敗しました。通信状況を確認して、もう一度お試しください。");
    }
  }

  async function saveDevice(event) {
    event.preventDefault();
    setDeviceMessage("保存しています...");

    try {
      const { response, result } = await postJson("/api/devices", deviceForm);
      if (!response.ok) {
        setDeviceMessage(result.error || "保存に失敗しました。");
        return;
      }

      setDeviceForm(emptyDeviceForm());
      setDeviceMessage("端末を保存しました。");
      await loadDevices();
    } catch (error) {
      setDeviceMessage(error.message || "保存に失敗しました。通信状況を確認して、もう一度お試しください。");
    }
  }

  async function saveSettings(event) {
    event.preventDefault();
    setSettingsMessage("保存しています...");

    try {
      const { response, result } = await postJson("/api/settings", settingsForm);
      if (!response.ok) {
        setSettingsMessage(result.error || "保存に失敗しました。");
        return;
      }

      setSettingsForm(result.settings);
      setSettingsMessage("デザイン設定を保存しました。");
    } catch (error) {
      setSettingsMessage(error.message || "保存に失敗しました。通信状況を確認して、もう一度お試しください。");
    }
  }

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    location.href = "/login";
  }

  return (
    <main className="app-shell">
      <section className="topbar">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>管理</h1>
        </div>
        <div className="topbar-actions">
          <Link className="admin-link" href="/">
            受付へ
          </Link>
          <button className="admin-link button-link" onClick={logout} type="button">
            ログアウト
          </button>
        </div>
      </section>

      <section className="panel admin-section">
        <div className="section-title">デザイン設定</div>
        <form className="staff-form" onSubmit={saveSettings}>
          <SettingsGroup title="基本設定" defaultOpen>
            <label className="field">
              <span>受付画面タイトル</span>
              <input
                autoComplete="off"
                onChange={(event) => setSettingsForm({ ...settingsForm, brandName: event.target.value })}
                placeholder="例：DECO MUSIC 受付"
                type="text"
                value={settingsForm.brandName}
              />
            </label>
            <label className="field">
              <span>ロゴ画像URL</span>
              <input
                autoComplete="off"
                onChange={(event) => setSettingsForm({ ...settingsForm, logoUrl: event.target.value })}
                placeholder="https://..."
                type="url"
                value={settingsForm.logoUrl}
              />
            </label>
            <div className="color-grid">
              <ColorField
                label="背景色"
                value={settingsForm.backgroundColor}
                onChange={(value) => setSettingsForm({ ...settingsForm, backgroundColor: value })}
              />
              <ColorField
                label="カード色"
                value={settingsForm.surfaceColor}
                onChange={(value) => setSettingsForm({ ...settingsForm, surfaceColor: value })}
              />
              <ColorField
                label="メイン色"
                value={settingsForm.accentColor}
                onChange={(value) => setSettingsForm({ ...settingsForm, accentColor: value })}
              />
            </div>
          </SettingsGroup>

          <SettingsGroup title="文字色">
            <div className="color-grid">
              <ColorField
                label="文字色"
                value={settingsForm.textColor}
                onChange={(value) => setSettingsForm({ ...settingsForm, textColor: value })}
              />
              <ColorField
                label="ラベル色"
                value={settingsForm.labelColor}
                onChange={(value) => setSettingsForm({ ...settingsForm, labelColor: value })}
              />
              <ColorField
                label="タイトル色"
                value={settingsForm.titleColor}
                onChange={(value) => setSettingsForm({ ...settingsForm, titleColor: value })}
              />
              <ColorField
                label="端末表示の色"
                value={settingsForm.deviceLabelColor}
                onChange={(value) => setSettingsForm({ ...settingsForm, deviceLabelColor: value })}
              />
              <ColorField
                label="入力ラベルの色"
                value={settingsForm.inputLabelColor}
                onChange={(value) => setSettingsForm({ ...settingsForm, inputLabelColor: value })}
              />
              <ColorField
                label="先生カード文字色"
                value={settingsForm.staffCardTextColor}
                onChange={(value) => setSettingsForm({ ...settingsForm, staffCardTextColor: value })}
              />
              <ColorField
                label="メッセージ色"
                value={settingsForm.messageColor}
                onChange={(value) => setSettingsForm({ ...settingsForm, messageColor: value })}
              />
            </div>
          </SettingsGroup>

          <SettingsGroup title="入口ボタンの色">
            <ButtonColorGroup
              title="担当講師の名前を検索する"
              backgroundValue={settingsForm.staffButtonBackgroundColor}
              textValue={settingsForm.staffButtonTextColor}
              borderValue={settingsForm.staffButtonBorderColor}
              onBackgroundChange={(value) => setSettingsForm({ ...settingsForm, staffButtonBackgroundColor: value })}
              onTextChange={(value) => setSettingsForm({ ...settingsForm, staffButtonTextColor: value })}
              onBorderChange={(value) => setSettingsForm({ ...settingsForm, staffButtonBorderColor: value })}
            />
            <ButtonColorGroup
              title="体験レッスンはこちら"
              backgroundValue={settingsForm.trialButtonBackgroundColor}
              textValue={settingsForm.trialButtonTextColor}
              borderValue={settingsForm.trialButtonBorderColor}
              onBackgroundChange={(value) => setSettingsForm({ ...settingsForm, trialButtonBackgroundColor: value })}
              onTextChange={(value) => setSettingsForm({ ...settingsForm, trialButtonTextColor: value })}
              onBorderChange={(value) => setSettingsForm({ ...settingsForm, trialButtonBorderColor: value })}
            />
            <ButtonColorGroup
              title="レッスン室レンタルの生徒さんはこちら"
              backgroundValue={settingsForm.rentalButtonBackgroundColor}
              textValue={settingsForm.rentalButtonTextColor}
              borderValue={settingsForm.rentalButtonBorderColor}
              onBackgroundChange={(value) => setSettingsForm({ ...settingsForm, rentalButtonBackgroundColor: value })}
              onTextChange={(value) => setSettingsForm({ ...settingsForm, rentalButtonTextColor: value })}
              onBorderChange={(value) => setSettingsForm({ ...settingsForm, rentalButtonBorderColor: value })}
            />
          </SettingsGroup>

          <SettingsGroup title="その他のボタン色">
            <div className="color-grid">
              <ColorField
                label="メインボタン文字色"
                value={settingsForm.primaryButtonTextColor}
                onChange={(value) => setSettingsForm({ ...settingsForm, primaryButtonTextColor: value })}
              />
              <ColorField
                label="白ボタン文字色"
                value={settingsForm.outlineButtonTextColor}
                onChange={(value) => setSettingsForm({ ...settingsForm, outlineButtonTextColor: value })}
              />
              <ColorField
                label="薄いボタン文字色"
                value={settingsForm.quietButtonTextColor}
                onChange={(value) => setSettingsForm({ ...settingsForm, quietButtonTextColor: value })}
              />
            </div>
          </SettingsGroup>

          <SettingsGroup title="プレビュー" defaultOpen>
            <DesignPreview settings={settingsForm} />
          </SettingsGroup>
          <button className="primary" type="submit">
            保存
          </button>
          <p className="message" aria-live="polite">
            {settingsMessage}
          </p>
        </form>
      </section>

      <section className="panel admin-section">
        <div className="section-title">担当者管理</div>
        <form className="staff-form" onSubmit={saveStaff}>
          <label className="field">
            <span>表示名</span>
            <input
              autoComplete="off"
              onChange={(event) => setStaffForm({ ...staffForm, name: event.target.value })}
              placeholder="例：A先生"
              type="text"
              value={staffForm.name}
            />
          </label>
          <label className="field">
            <span>SlackメンバーID</span>
            <input
              autoComplete="off"
              onChange={(event) => setStaffForm({ ...staffForm, slackUserId: event.target.value })}
              placeholder="例：U0B7ZFF4UTB"
              type="text"
              value={staffForm.slackUserId}
            />
          </label>
          <label className="field">
            <span>検索用カナ</span>
            <input
              autoComplete="off"
              onChange={(event) => setStaffForm({ ...staffForm, searchKana: event.target.value })}
              placeholder="例：ファヨン"
              type="text"
              value={staffForm.searchKana}
            />
          </label>
          <label className="field">
            <span>プロフィール画像URL</span>
            <input
              autoComplete="off"
              onChange={(event) => setStaffForm({ ...staffForm, imageUrl: event.target.value })}
              placeholder="https://..."
              type="url"
              value={staffForm.imageUrl}
            />
          </label>
          <label className="toggle-row">
            <input
              checked={staffForm.enabled}
              onChange={(event) => setStaffForm({ ...staffForm, enabled: event.target.checked })}
              type="checkbox"
            />
            <span>受付画面に表示する</span>
          </label>
          <div className="form-actions">
            <button className="primary" type="submit">
              保存
            </button>
            <button className="secondary" onClick={() => setStaffForm(emptyStaffForm())} type="button">
              新規入力
            </button>
          </div>
          <p className="message" aria-live="polite">
            {staffMessage}
          </p>
        </form>
        <div className="admin-list">
          {staffItems.length ? (
            staffItems.map((item) => (
              <article className="admin-row" key={item.id}>
                <div className="staff-admin-info">
                  <Avatar item={item} className="admin-avatar" />
                  <div>
                    <strong>{item.name}</strong>
                    {item.searchKana ? <p>{item.searchKana}</p> : null}
                    <p>{item.slackUserId}</p>
                    {item.imageUrl ? <p>プロフィール画像 設定済み</p> : <p>プロフィール画像 未設定</p>}
                  </div>
                </div>
                <div className="row-actions">
                  <span className={item.enabled ? "badge ok" : "badge muted"}>{item.enabled ? "表示中" : "非表示"}</span>
                  <button
                    className="secondary small"
                    onClick={() => {
                      setStaffForm(item);
                      setStaffMessage(`${item.name} を編集中です。`);
                    }}
                    type="button"
                  >
                    編集
                  </button>
                </div>
              </article>
            ))
          ) : (
            <p className="empty">担当者はまだ登録されていません。</p>
          )}
        </div>
      </section>

      <section className="panel admin-section">
        <div className="section-title">端末管理</div>
        <form className="staff-form" onSubmit={saveDevice}>
          <label className="field">
            <span>校舎名</span>
            <input
              autoComplete="off"
              onChange={(event) => setDeviceForm({ ...deviceForm, schoolName: event.target.value })}
              placeholder="例：原宿校"
              type="text"
              value={deviceForm.schoolName}
            />
          </label>
          <label className="field">
            <span>端末名</span>
            <input
              autoComplete="off"
              onChange={(event) => setDeviceForm({ ...deviceForm, deviceName: event.target.value })}
              placeholder="例：受付iPad 1"
              type="text"
              value={deviceForm.deviceName}
            />
          </label>
          <label className="field">
            <span>端末キー</span>
            <input
              autoComplete="off"
              onChange={(event) => setDeviceForm({ ...deviceForm, deviceKey: event.target.value })}
              placeholder="例：harajuku-front-1"
              type="text"
              value={deviceForm.deviceKey}
            />
          </label>
          <label className="field">
            <span>端末別ロゴURL</span>
            <input
              autoComplete="off"
              onChange={(event) => setDeviceForm({ ...deviceForm, logoUrl: event.target.value })}
              placeholder="未設定なら全体ロゴを使用"
              type="url"
              value={deviceForm.logoUrl}
            />
          </label>
          <label className="field">
            <span>通信エラー時の問い合わせ電話番号</span>
            <input
              autoComplete="off"
              onChange={(event) => setDeviceForm({ ...deviceForm, supportPhoneNumber: event.target.value })}
              placeholder="例：042-000-0000"
              type="tel"
              value={deviceForm.supportPhoneNumber}
            />
          </label>
          <label className="toggle-row">
            <input
              checked={deviceForm.enabled}
              onChange={(event) => setDeviceForm({ ...deviceForm, enabled: event.target.checked })}
              type="checkbox"
            />
            <span>この端末を有効にする</span>
          </label>
          <div className="section-subtitle">この端末の体験レッスン通知先</div>
          <div className="check-list">
            {staffItems.length ? (
              staffItems.map((item) => (
                <label className="check-row" key={item.id}>
                  <input
                    checked={deviceForm.trialLessonStaffIds.includes(item.id)}
                    onChange={(event) => {
                      const ids = new Set(deviceForm.trialLessonStaffIds);
                      if (event.target.checked) ids.add(item.id);
                      else ids.delete(item.id);
                      setDeviceForm({ ...deviceForm, trialLessonStaffIds: [...ids] });
                    }}
                    type="checkbox"
                  />
                  <span>{item.name}</span>
                </label>
              ))
            ) : (
              <p className="empty">担当者を登録すると選択できます。</p>
            )}
          </div>
          <div className="form-actions">
            <button className="primary" type="submit">
              保存
            </button>
            <button className="secondary" onClick={() => setDeviceForm(emptyDeviceForm())} type="button">
              新規入力
            </button>
          </div>
          <p className="message" aria-live="polite">
            {deviceMessage}
          </p>
        </form>
        <div className="admin-list">
          {deviceItems.length ? (
            deviceItems.map((item) => {
              const url = `${location.origin}/?device=${encodeURIComponent(item.deviceKey)}`;
              return (
                <article className="admin-row" key={item.id}>
                  <div>
                    <strong>
                      {item.schoolName} / {item.deviceName}
                    </strong>
                    <p>{item.deviceKey}</p>
                    <p>{item.logoUrl ? "端末別ロゴ 設定済み" : "端末別ロゴ 未設定"}</p>
                    <p>{item.supportPhoneNumber ? `問い合わせ電話 ${item.supportPhoneNumber}` : "問い合わせ電話 未設定"}</p>
                    <p>{recipientLabel(item.trialLessonStaffIds, staffItems)}</p>
                    <p>
                      <a className="text-link compact" href={url} target="_blank" rel="noreferrer">
                        {url}
                      </a>
                    </p>
                  </div>
                  <div className="row-actions">
                    <span className={item.enabled ? "badge ok" : "badge muted"}>{item.enabled ? "有効" : "無効"}</span>
                    <button
                      className="secondary small"
                      onClick={() => {
                        setDeviceForm({
                          ...emptyDeviceForm(),
                          ...item,
                          logoUrl: item.logoUrl || "",
                          supportPhoneNumber: item.supportPhoneNumber || "",
                          trialLessonStaffIds: item.trialLessonStaffIds || [],
                        });
                        setDeviceMessage(`${item.schoolName} / ${item.deviceName} を編集中です。`);
                      }}
                      type="button"
                    >
                      編集
                    </button>
                  </div>
                </article>
              );
            })
          ) : (
            <p className="empty">端末はまだ登録されていません。</p>
          )}
        </div>
      </section>

      <section className="panel">
        <div className="section-title">直近の受付</div>
        <div className="visits">
          {visits.length ? (
            visits.map((item) => {
              const date = new Date(item.createdAt).toLocaleString("ja-JP");
              const location = [item.schoolName, item.deviceName].filter(Boolean).join(" / ") || "校舎未設定";
              return (
                <article className="visit-row" key={item.id}>
                  <div>
                    <strong>{item.visitorName}様</strong>
                    <p>
                      {item.staffName} / {location} / {date}
                    </p>
                  </div>
                  <span className={item.slackOk ? "badge ok" : "badge error"}>{item.slackOk ? "送信済み" : "送信失敗"}</span>
                </article>
              );
            })
          ) : (
            <p className="empty">受付履歴はまだありません。</p>
          )}
        </div>
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

function emptyStaffForm() {
  return {
    id: "",
    name: "",
    searchKana: "",
    slackUserId: "",
    imageUrl: "",
    enabled: true,
  };
}

function emptyDeviceForm() {
  return {
    id: "",
    schoolName: "",
    deviceName: "",
    deviceKey: "",
    logoUrl: "",
    supportPhoneNumber: "",
    trialLessonStaffIds: [],
    enabled: true,
  };
}

function recipientLabel(ids = [], staffItems = []) {
  if (!ids.length) return "体験レッスン通知先 未設定";

  const names = staffItems
    .filter((item) => ids.includes(item.id))
    .map((item) => item.name);

  return names.length ? `体験レッスン通知先 ${names.join("、")}` : "体験レッスン通知先 設定済み";
}

function emptySettingsForm() {
  return {
    brandName: "受付",
    logoUrl: "",
    backgroundColor: "#f6f4ef",
    surfaceColor: "#ffffff",
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
}

function SettingsGroup({ children, defaultOpen = false, title }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <details className="settings-group" onToggle={(event) => setIsOpen(event.currentTarget.open)} open={isOpen}>
      <summary>{title}</summary>
      <div className="settings-group-body">{children}</div>
    </details>
  );
}

function ButtonColorGroup({
  backgroundValue,
  borderValue,
  onBackgroundChange,
  onBorderChange,
  onTextChange,
  textValue,
  title,
}) {
  return (
    <div className="button-color-group">
      <div className="section-subtitle">{title}</div>
      <div className="color-grid">
        <ColorField label="背景色" value={backgroundValue} onChange={onBackgroundChange} />
        <ColorField label="文字色" value={textValue} onChange={onTextChange} />
        <ColorField label="枠線色" value={borderValue} onChange={onBorderChange} />
      </div>
    </div>
  );
}

function DesignPreview({ settings }) {
  const style = {
    "--preview-bg": settings.backgroundColor,
    "--preview-surface": settings.surfaceColor,
    "--preview-text": settings.textColor,
    "--preview-label": settings.labelColor,
    "--preview-title": settings.titleColor,
    "--preview-device-label": settings.deviceLabelColor,
    "--preview-input-label": settings.inputLabelColor,
    "--preview-accent": settings.accentColor,
    "--preview-primary-button-text": settings.primaryButtonTextColor,
    "--preview-outline-button-text": settings.outlineButtonTextColor,
    "--preview-quiet-button-text": settings.quietButtonTextColor,
    "--preview-staff-button-bg": settings.staffButtonBackgroundColor,
    "--preview-staff-button-text": settings.staffButtonTextColor,
    "--preview-staff-button-border": settings.staffButtonBorderColor,
    "--preview-trial-button-bg": settings.trialButtonBackgroundColor,
    "--preview-trial-button-text": settings.trialButtonTextColor,
    "--preview-trial-button-border": settings.trialButtonBorderColor,
    "--preview-rental-button-bg": settings.rentalButtonBackgroundColor,
    "--preview-rental-button-text": settings.rentalButtonTextColor,
    "--preview-rental-button-border": settings.rentalButtonBorderColor,
    "--preview-staff-card-text": settings.staffCardTextColor,
    "--preview-message": settings.messageColor,
  };

  return (
    <div className="design-preview" style={style}>
      <div className="design-preview-screen">
        <p className="preview-eyebrow">Reception</p>
        <h2>{settings.brandName || "受付"}</h2>
        <p className="preview-device">原宿校 / 受付iPad 1</p>
        <div className="preview-card">
          <div className="preview-button-grid">
            <button className="preview-choice main" type="button">
              担当講師の名前を検索する
            </button>
            <button className="preview-choice outline" type="button">
              体験レッスンはこちら
            </button>
            <button className="preview-choice quiet" type="button">
              レッスン室レンタルの生徒さんはこちら
            </button>
          </div>
          <label className="preview-field">
            <span>来訪者の名前</span>
            <div>例：山田 太郎</div>
          </label>
          <div className="preview-staff-card">A先生</div>
          <p className="preview-message">担当者へSlack通知を送信しました。</p>
        </div>
      </div>
    </div>
  );
}

function ColorField({ label, value, onChange }) {
  return (
    <label className="field color-field">
      <span>{label}</span>
      <div className="color-row">
        <input onChange={(event) => onChange(event.target.value)} type="color" value={value} />
        <input
          autoComplete="off"
          onChange={(event) => onChange(event.target.value)}
          pattern="#[0-9a-fA-F]{6}"
          type="text"
          value={value}
        />
      </div>
    </label>
  );
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  if (response.status === 401) {
    location.href = "/login";
    throw new Error("Unauthorized");
  }
  return safeJson(response);
}

async function postJson(url, body) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const result = await safeJson(response);
    return { response, result };
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("保存に時間がかかっています。通信状況を確認して、もう一度お試しください。");
    }
    throw new Error("保存に失敗しました。通信状況を確認して、もう一度お試しください。");
  } finally {
    clearTimeout(timeout);
  }
}

async function safeJson(response) {
  try {
    return await response.json();
  } catch {
    return { error: "サーバーから正しい応答がありませんでした。" };
  }
}
