"use client";

import { useState } from "react";

export function useCopyOnce() {
  const [copied, setCopied] = useState(false);

  async function copyOnce(value) {
    if (copied || !value) return false;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    return true;
  }

  function reset() {
    setCopied(false);
  }

  return { copied, copyOnce, reset };
}
