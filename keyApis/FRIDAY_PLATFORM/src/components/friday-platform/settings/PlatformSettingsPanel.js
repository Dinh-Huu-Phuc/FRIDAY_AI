"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validatePlatformSettings } from "@/validators/settingsValidator";

export default function PlatformSettingsPanel() {
  // TODO: Settings will move to a future Admin Portal.
  const [values, setValues] = useState({ defaultDailyLimit: 1000000, rateLimitPerMinute: 120, maxOutputTokens: 4096, enableExpiration: true, requireAllowedOrigins: false, enableStorageAnalytics: true, enableQuotaAlerts: true });
  const [message, setMessage] = useState("");

  function save() {
    const result = validatePlatformSettings(values);
    setMessage(result.ok ? "Settings validated locally. Backend persistence can be connected next." : Object.values(result.errors)[0]);
  }

  return (
    <Card>
      <CardHeader><CardTitle>Platform Defaults</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3"><div><Label>Default daily token limit</Label><Input type="number" value={values.defaultDailyLimit} onChange={(e) => setValues({ ...values, defaultDailyLimit: e.target.value })} /></div><div><Label>Rate limit per minute</Label><Input type="number" value={values.rateLimitPerMinute} onChange={(e) => setValues({ ...values, rateLimitPerMinute: e.target.value })} /></div><div><Label>Max output tokens</Label><Input type="number" value={values.maxOutputTokens} onChange={(e) => setValues({ ...values, maxOutputTokens: e.target.value })} /></div></div>
        <div className="grid gap-2 md:grid-cols-2">{["enableExpiration", "requireAllowedOrigins", "enableStorageAnalytics", "enableQuotaAlerts"].map((key) => <label key={key} className="flex items-center gap-2 rounded border border-white/10 p-3 text-sm"><input type="checkbox" checked={values[key]} onChange={(e) => setValues({ ...values, [key]: e.target.checked })} />{key}</label>)}</div>
        <Button onClick={save}>Save Settings</Button>{message ? <p className="text-sm text-slate-300">{message}</p> : null}
      </CardContent>
    </Card>
  );
}
