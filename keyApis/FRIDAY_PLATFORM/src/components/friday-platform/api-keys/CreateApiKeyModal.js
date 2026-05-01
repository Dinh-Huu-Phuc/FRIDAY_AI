"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validateCreateApiKeyForm } from "@/validators/apiKeyValidator";

const scopes = ["agent:chat", "agent:tts", "memory:read", "memory:write", "storage:read", "rag:query", "runtime:read"];

export default function CreateApiKeyModal({ open, onClose, onCreate }) {
  const [values, setValues] = useState({ name: "", environment: "dev", token_limit_daily: 100000, allowed_origins: "", scopes: ["agent:chat", "rag:query"] });
  const [errors, setErrors] = useState({});

  async function submit() {
    const result = validateCreateApiKeyForm(values);
    setErrors(result.errors);
    if (!result.ok) return;
    await onCreate({
      name: values.name,
      environment: values.environment === "production" ? "prod" : values.environment === "development" ? "dev" : values.environment,
      token_limit_daily: Number(values.token_limit_daily),
      notes: values.allowed_origins ? `Allowed origins:\n${values.allowed_origins}` : null,
      scopes: values.scopes.filter((scope) => ["agent:chat", "rag:query", "runtime:read"].includes(scope))
    });
    setValues({ name: "", environment: "dev", token_limit_daily: 100000, allowed_origins: "", scopes: ["agent:chat", "rag:query"] });
    onClose();
  }

  function toggleScope(scope) {
    setValues((current) => ({
      ...current,
      scopes: current.scopes.includes(scope) ? current.scopes.filter((item) => item !== scope) : [...current.scopes, scope]
    }));
  }

  return (
    <Dialog open={open}>
      <DialogContent>
        <DialogHeader><DialogTitle>Create FRIDAY Internal API Key</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2"><Label>Key name</Label><Input value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} />{errors.name ? <p className="text-xs text-red-300">{errors.name}</p> : null}</div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>Environment</Label><select className="h-10 w-full rounded-md border border-white/10 bg-slate-950 px-3 text-sm" value={values.environment} onChange={(e) => setValues({ ...values, environment: e.target.value })}><option value="development">development</option><option value="production">production</option><option value="local">local</option></select></div>
            <div className="space-y-2"><Label>Daily token limit</Label><Input type="number" value={values.token_limit_daily} onChange={(e) => setValues({ ...values, token_limit_daily: e.target.value })} /></div>
          </div>
          <div className="space-y-2"><Label>Allowed origins</Label><textarea className="min-h-20 w-full rounded-md border border-white/10 bg-slate-950 p-3 text-sm outline-none" value={values.allowed_origins} onChange={(e) => setValues({ ...values, allowed_origins: e.target.value })} placeholder="https://app.example.com" /></div>
          <div className="space-y-2"><Label>Permissions</Label><div className="grid gap-2 sm:grid-cols-2">{scopes.map((scope) => <label key={scope} className="flex items-center gap-2 rounded-md border border-white/10 p-2 text-sm text-slate-300"><input type="checkbox" checked={values.scopes.includes(scope)} onChange={() => toggleScope(scope)} />{scope}</label>)}</div></div>
        </div>
        <DialogFooter><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={submit}>Create Key</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
