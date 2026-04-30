"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function LockedTabNotice({ tab, onLogin }) {
  return (
    <Card className="mx-auto max-w-xl">
      <CardContent className="p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-cyan-300/25 bg-cyan-300/10 text-cyan-200">Lock</div>
        <h2 className="text-xl font-semibold text-white">Login required</h2>
        <p className="mt-2 text-sm text-slate-400">The {tab} section contains private gateway data and requires an authenticated FRIDAY Platform session.</p>
        <Button className="friday-gradient-button mt-5" onClick={onLogin}>Login to continue</Button>
      </CardContent>
    </Card>
  );
}
