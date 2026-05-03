"use client"

import { useState } from "react"

import { PageShell } from "@/components/layout/page-shell"
import { ApiKeySettingsPanel } from "@/components/api-key/ApiKeySettingsPanel"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { loadSettings, saveSettings } from "@/lib/api/runtime"
import type { SettingsState } from "@/lib/types"

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsState>(() => loadSettings())
  const [saved, setSaved] = useState(false)

  function update<K extends keyof SettingsState>(key: K, value: SettingsState[K]) {
    setSaved(false)
    setSettings((current) => (current ? { ...current, [key]: value } : current))
  }

  function handleSave() {
    if (!settings) return
    saveSettings(settings)
    setSaved(true)
  }

  return (
    <PageShell
      title="Settings"
      description="Configure backend base URL and lightweight dashboard behavior."
      backendStatus={{ status: "mock", label: "Local Settings", detail: "Stored in browser localStorage.", source: "mock" }}
      safetyMode="strict"
      showConnectionToggle={false}
    >
      <div className="space-y-5">
        <ApiKeySettingsPanel />

        <Card className="max-w-3xl border-white/10 bg-white/[0.03]">
          <CardHeader>
            <CardTitle>Dashboard Settings</CardTitle>
            <CardDescription>
              These preferences control the client-side dashboard experience.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-200">Backend Base URL</label>
              <Input
                value={settings.backendBaseUrl}
                onChange={(event) => update("backendBaseUrl", event.target.value)}
                placeholder="http://127.0.0.1:8001"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <ToggleRow
                label="Auto Refresh"
                description="Allow pages to refresh runtime data automatically."
                checked={settings.autoRefresh}
                onCheckedChange={(value) => update("autoRefresh", value)}
              />
              <ToggleRow
                label="Show Safety Mode"
                description="Keep safety mode visible in page headers."
                checked={settings.showSafetyMode}
                onCheckedChange={(value) => update("showSafetyMode", value)}
              />
              <ToggleRow
                label="Screenshot Polling"
                description="Poll for new screenshot previews when available."
                checked={settings.screenshotPolling}
                onCheckedChange={(value) => update("screenshotPolling", value)}
              />
            </div>

            <div className="space-y-2 max-w-xs">
              <label className="text-sm font-medium text-zinc-200">Refresh Interval (ms)</label>
              <Input
                type="number"
                min={1000}
                step={1000}
                value={settings.refreshIntervalMs}
                onChange={(event) =>
                  update("refreshIntervalMs", Number(event.target.value || 0))
                }
              />
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={handleSave}>Save Settings</Button>
              {saved ? (
                <span className="text-sm text-emerald-300">
                  Settings saved to local browser storage.
                </span>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  )
}

function ToggleRow({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-[#0f1419] p-4">
      <div className="space-y-1">
        <p className="text-sm font-medium text-zinc-100">{label}</p>
        <p className="text-sm leading-6 text-zinc-400">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}
