"use client";

import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function login(event) {
    event.preventDefault();
    setMessage("確認しています...");

    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    const result = await response.json();
    if (!response.ok) {
      setMessage(result.error || "ログインできませんでした。");
      return;
    }

    location.href = "/admin";
  }

  return (
    <main className="login-shell">
      <section className="panel login-panel">
        <p className="eyebrow">Admin</p>
        <h1>管理ログイン</h1>
        <form className="login-form" onSubmit={login}>
          <label className="field">
            <span>パスワード</span>
            <input
              autoComplete="current-password"
              autoFocus
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              value={password}
            />
          </label>
          <button className="primary" type="submit">
            ログイン
          </button>
          <p className="message" aria-live="polite">
            {message}
          </p>
        </form>
        <Link className="text-link" href="/">
          受付へ戻る
        </Link>
      </section>
    </main>
  );
}
