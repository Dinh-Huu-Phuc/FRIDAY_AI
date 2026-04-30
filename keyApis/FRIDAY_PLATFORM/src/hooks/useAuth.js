"use client";

import { useCallback, useEffect, useState } from "react";
import { authService } from "@/services/authService";

export function useAuth({ autoLoad = true } = {}) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(autoLoad);

  const refreshMe = useCallback(async () => {
    setLoading(true);
    try {
      const data = await authService.me();
      setUser(data.user || data);
      return data.user || data;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!autoLoad) return;
    refreshMe().catch(() => {
      setUser(null);
      setLoading(false);
    });
  }, [autoLoad, refreshMe]);

  async function login(payload) {
    const data = await authService.login(payload);
    setUser(data.user || null);
    return data;
  }

  async function register(payload) {
    const data = await authService.register(payload);
    return data;
  }

  async function logout() {
    await authService.logout();
    setUser(null);
  }

  return { user, loading, login, register, logout, refreshMe };
}
