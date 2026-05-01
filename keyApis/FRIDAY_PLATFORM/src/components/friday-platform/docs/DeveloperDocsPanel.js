"use client";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DeveloperDocsPanel({ onCreate }) {
  return (
    <div className="space-y-4">
      <Alert>Use FRIDAY internal API keys only. Never expose an OpenAI API key or backend secret in browser code.</Alert>
      <Card>
        <CardHeader><CardTitle>What is a FRIDAY internal API key?</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm leading-6 text-slate-300">
          <p>A FRIDAY key is a gateway credential issued by your backend. It lets clients call FRIDAY services while provider keys remain hidden server-side.</p>
          <Button className="friday-gradient-button" onClick={onCreate}>Create API Key</Button>
        </CardContent>
      </Card>
      <Card><CardHeader><CardTitle>Agent Chat Endpoint</CardTitle></CardHeader><CardContent><pre className="code-block overflow-auto rounded-lg p-4 text-sm">{`POST /api/agent/chat
Authorization: Bearer friday_live_xxx
Content-Type: application/json

{
  "message": "Summarize the active runtime state"
}`}</pre></CardContent></Card>
      <Card><CardHeader><CardTitle>JavaScript Fetch Example</CardTitle></CardHeader><CardContent><pre className="code-block overflow-auto rounded-lg p-4 text-sm">{`await fetch("https://your-friday-gateway/api/agent/chat", {
  method: "POST",
  headers: {
    "Authorization": "Bearer friday_live_xxx",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ message: "Hello FRIDAY" })
});`}</pre></CardContent></Card>
      <Card><CardHeader><CardTitle>Security Notes</CardTitle></CardHeader><CardContent className="space-y-2 text-sm text-slate-300"><p>Do not expose OpenAI API keys on the client.</p><p>Use FRIDAY internal API keys only.</p><p>All requests should go through the FRIDAY gateway.</p><p>Full API secrets are shown only once when created or rotated.</p></CardContent></Card>
    </div>
  );
}
