import "./globals.css";

export const metadata = {
  title: "FRIDAY Platform",
  description: "Internal API key gateway dashboard for FRIDAY"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="friday-grid min-h-screen" suppressHydrationWarning>{children}</body>
    </html>
  );
}
