"use client";

import { useCallback, useState } from "react";

export function useToast() {
  const [toast, setToast] = useState(null);
  const showToast = useCallback((message, type = "default") => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3200);
  }, []);
  return { toast, showToast, clearToast: () => setToast(null) };
}
