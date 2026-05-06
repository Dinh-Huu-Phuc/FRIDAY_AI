import type { Metadata } from "next";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GlobalConnectionReport } from "@/components/layout/global-connection-report";
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
    <html lang="en" className="dark h-full antialiased" suppressHydrationWarning>
      <body
        className="h-full overflow-hidden bg-transparent font-sans text-foreground"
        suppressHydrationWarning
      >
        <TooltipProvider>
          <div className="flex h-screen flex-col overflow-hidden bg-transparent text-zinc-50">
            <AppSidebar />
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-transparent">
              <GlobalConnectionReport />
              {children}
            </div>
          </div>
        </TooltipProvider>
      </body>
    </html>
  );
}
