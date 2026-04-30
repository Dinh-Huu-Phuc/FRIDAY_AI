"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PlatformHeader from "@/components/friday-platform/shell/PlatformHeader";
import PlatformSidebar from "@/components/friday-platform/shell/PlatformSidebar";
import ApiKeyManager from "@/components/friday-platform/api-keys/ApiKeyManager";
import OverviewCards from "@/components/friday-platform/overview/OverviewCards";
import UsageQuotaPanel from "@/components/friday-platform/usage/UsageQuotaPanel";
import StoragePanel from "@/components/friday-platform/storage/StoragePanel";
import ActivityLogPanel from "@/components/friday-platform/activity/ActivityLogPanel";
import DeveloperDocsPanel from "@/components/friday-platform/docs/DeveloperDocsPanel";
import { authService } from "@/services/authService";
import { ROUTES } from "@/router/routes";
import { platformNavigation, protectedTabs, tabCopy } from "@/router/navigation";
import { useAuth } from "@/hooks/useAuth";
import LockedTabNotice from "@/components/friday-platform/shared/LockedTabNotice";

export default function FridayPlatformShell() {
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab") || "overview";
  const validTabs = useMemo(() => new Set(platformNavigation.map((item) => item.id)), []);
  const [activeTab, setActiveTab] = useState(validTabs.has(requestedTab) ? requestedTab : "overview");
  const [createSignal, setCreateSignal] = useState(0);
  const router = useRouter();
  const { user, loading, refreshMe } = useAuth({ autoLoad: true });

  useEffect(() => {
    const nextTab = validTabs.has(requestedTab) ? requestedTab : "overview";
    if (protectedTabs.has(nextTab) && !loading && !user) {
      router.replace(`${ROUTES.login}?next=${encodeURIComponent(ROUTES.platform)}&tab=${nextTab}`);
      return;
    }
    setActiveTab(nextTab);
  }, [requestedTab, validTabs, loading, user, router]);

  function selectTab(tab) {
    if (protectedTabs.has(tab) && !user) {
      router.push(`${ROUTES.login}?next=${encodeURIComponent(ROUTES.platform)}&tab=${tab}`);
      return;
    }
    setActiveTab(tab);
    router.push(`${ROUTES.platform}?tab=${tab}`);
  }

  function goLogin(tab = "api-keys") {
    router.push(`${ROUTES.login}?next=${encodeURIComponent(ROUTES.platform)}&tab=${tab}`);
  }

  async function logout() {
    await authService.logout();
    await refreshMe().catch(() => null);
    router.replace(`${ROUTES.platform}?tab=overview`);
  }

  function createKey() {
    if (!user) {
      goLogin("api-keys");
      return;
    }
    selectTab("api-keys");
    setCreateSignal((value) => value + 1);
  }

  function renderActiveTab() {
    if (activeTab === "overview") return <OverviewCards user={user} onCreate={createKey} onDocs={() => selectTab("docs")} />;
    if (activeTab === "docs") return <DeveloperDocsPanel user={user} onCreate={createKey} />;
    if (protectedTabs.has(activeTab) && !user) {
      return <LockedTabNotice tab={tabCopy[activeTab]?.[0] || activeTab} onLogin={() => goLogin(activeTab)} />;
    }
    if (activeTab === "api-keys") return <ApiKeyManager createSignal={createSignal} />;
    if (activeTab === "usage") return <UsageQuotaPanel />;
    if (activeTab === "storage") return <StoragePanel />;
    if (activeTab === "activity") return <ActivityLogPanel />;
    return <OverviewCards user={user} onCreate={createKey} onDocs={() => selectTab("docs")} />;
  }

  return (
    <div className="flex min-h-screen">
      <PlatformSidebar activeTab={activeTab} onSelectTab={selectTab} user={user} />
      <section className="flex min-w-0 flex-1 flex-col">
        <PlatformHeader activeTab={activeTab} user={user} onLogout={logout} onCreate={createKey} onLogin={() => goLogin(activeTab)} onRegister={() => router.push(`${ROUTES.login}?mode=register&next=${encodeURIComponent(ROUTES.platform)}&tab=api-keys`)} />
        <div className="flex gap-2 overflow-x-auto border-b border-white/10 bg-slate-950/65 p-3 md:hidden">
          {platformNavigation.map((item) => (
            <button
              key={item.id}
              className={`shrink-0 rounded-full px-3 py-2 text-xs ${activeTab === item.id ? "bg-cyan-400 text-slate-950" : "bg-white/5 text-slate-300"}`}
              onClick={() => selectTab(item.id)}
            >
              {item.label}{item.protected && !user ? " Lock" : ""}
            </button>
          ))}
        </div>
        <main className={activeTab === "overview" ? "" : "space-y-5 p-5"}>
          {renderActiveTab()}
        </main>
        <div className="sr-only">{tabCopy[activeTab]?.[0]}</div>
      </section>
    </div>
  );
}
