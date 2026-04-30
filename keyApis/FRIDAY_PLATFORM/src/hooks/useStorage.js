"use client";

import { useEffect, useState } from "react";
import { storageService } from "@/services/storageService";

export function useStorage() {
  const [storage, setStorage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    storageService.get().then(setStorage).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, []);

  return { storage, loading, error };
}
