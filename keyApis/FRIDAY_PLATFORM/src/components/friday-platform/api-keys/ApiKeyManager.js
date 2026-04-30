"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ApiKeyTable from "@/components/friday-platform/api-keys/ApiKeyTable";
import CreateApiKeyModal from "@/components/friday-platform/api-keys/CreateApiKeyModal";
import RevealKeyModal from "@/components/friday-platform/api-keys/RevealKeyModal";
import ConfirmDialog from "@/components/friday-platform/shared/ConfirmDialog";
import Toast from "@/components/friday-platform/shared/Toast";
import { useApiKeys } from "@/hooks/useApiKeys";
import { useToast } from "@/hooks/useToast";

export default function ApiKeyManager({ createSignal = 0 }) {
  const { keys, loading, error, createKey, rotateKey, revokeKey } = useApiKeys();
  const { toast, showToast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [secret, setSecret] = useState("");
  const [pending, setPending] = useState(null);

  useEffect(() => {
    if (createSignal) setCreateOpen(true);
  }, [createSignal]);

  async function handleCreate(payload) {
    const data = await createKey(payload);
    setSecret(data.secret || "");
  }

  async function confirmAction() {
    if (!pending) return;
    if (pending.type === "rotate") {
      try {
        const data = await rotateKey(pending.key.id);
        setSecret(data.secret || "");
      } catch (error) {
        showToast(error.message);
      }
    } else {
      await revokeKey(pending.key.id);
      showToast("API key revoked.");
    }
    setPending(null);
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between"><CardTitle>FRIDAY Internal API Keys</CardTitle><Button onClick={() => setCreateOpen(true)}>Create API Key</Button></CardHeader>
        <CardContent>{loading ? <div className="text-sm text-slate-400">Loading keys...</div> : error ? <div className="text-sm text-red-300">{error}</div> : <ApiKeyTable keys={keys} onRotate={(key) => setPending({ type: "rotate", key })} onRevoke={(key) => setPending({ type: "revoke", key })} />}</CardContent>
      </Card>
      <CreateApiKeyModal open={createOpen} onClose={() => setCreateOpen(false)} onCreate={handleCreate} />
      <RevealKeyModal open={Boolean(secret)} secret={secret} onClose={() => setSecret("")} />
      <ConfirmDialog open={Boolean(pending)} title={pending?.type === "rotate" ? "Rotate API key?" : "Revoke API key?"} description={pending?.type === "rotate" ? "A new full secret will be shown once. Existing secret should stop being used." : "This key will be disabled and cannot be used by clients."} confirmLabel={pending?.type === "rotate" ? "Rotate" : "Revoke"} danger={pending?.type === "revoke"} onCancel={() => setPending(null)} onConfirm={confirmAction} />
      <Toast toast={toast} />
    </>
  );
}
