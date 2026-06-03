export async function sendSlackMessage(channel, text) {
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
