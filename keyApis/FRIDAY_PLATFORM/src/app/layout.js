import "./globals.css";

export const metadata = {
  title: "FRIDAY Platform",
  description: "Internal API key gateway dashboard for FRIDAY"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="friday-grid min-h-screen">{children}</body>
    </html>
  );
}
