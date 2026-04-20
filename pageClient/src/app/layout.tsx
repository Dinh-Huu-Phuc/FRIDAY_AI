import type { Metadata } from "next";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "@/components/layout/app-sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "FIRDAY Agent Dashboard",
  description: "Operate and monitor FIRDAY with a dark-mode AI control panel.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full bg-background font-sans text-foreground">
        <TooltipProvider>
          <div className="flex min-h-screen bg-[#0b0f14] text-zinc-50">
            <AppSidebar />
            <div className="flex min-h-screen flex-1 flex-col">{children}</div>
          </div>
        </TooltipProvider>
      </body>
    </html>
  );
}
