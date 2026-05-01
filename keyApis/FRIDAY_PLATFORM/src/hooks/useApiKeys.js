"use client";

import { useCallback, useEffect, useState } from "react";
import { apiKeyService } from "@/services/apiKeyService";

export function useApiKeys() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reloadKeys = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiKeyService.list();
      setKeys(data.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reloadKeys();
  }, [reloadKeys]);

  async function createKey(payload) {
    const data = await apiKeyService.create(payload);
    await reloadKeys();
    return data;
  }

  async function rotateKey(keyId) {
    const data = await apiKeyService.rotate(keyId);
    await reloadKeys();
    return data;
  }

  async function revokeKey(keyId) {
    await apiKeyService.revoke(keyId);
    await reloadKeys();
  }

  return { keys, loading, error, createKey, rotateKey, revokeKey, reloadKeys };
}
