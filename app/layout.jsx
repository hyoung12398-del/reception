import "./globals.css";

export const metadata = {
  title: "受付",
  description: "Slack通知対応受付システム",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
