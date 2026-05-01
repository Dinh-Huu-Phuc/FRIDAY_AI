"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCopyOnce } from "@/hooks/useCopyOnce";

export default function RevealKeyModal({ secret, open, onClose }) {
  const { copied, copyOnce, reset } = useCopyOnce();

  useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  function done() {
    reset();
    onClose();
  }

  return (
    <Dialog open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Copy this FRIDAY API key now</DialogTitle>
          <DialogDescription>Copy this secret key now. For security reasons, you will not be able to view or copy it again.</DialogDescription>
        </DialogHeader>
        <div className="masked-secret break-all rounded-md p-3 text-sm">{secret}</div>
        <DialogFooter>
          <Button variant="secondary" disabled={copied} onClick={() => copyOnce(secret)}>{copied ? "Copied once" : "Copy once"}</Button>
          <Button onClick={done}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
