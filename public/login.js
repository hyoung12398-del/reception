const loginForm = document.querySelector("#loginForm");
const password = document.querySelector("#password");
const loginMessage = document.querySelector("#loginMessage");

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginMessage.textContent = "確認しています...";

  const response = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: password.value }),
  });

  const result = await response.json();
  if (!response.ok) {
    loginMessage.textContent = result.error || "ログインできませんでした。";
    return;
  }

  location.href = "/admin.html";
});
