"use client";

import { useEffect, useState } from "react";
import { usageService } from "@/services/usageService";

export function useUsage() {
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    usageService.get().then(setUsage).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, []);

  return { usage, loading, error };
}
