"use client";

import { useEffect, useState } from "react";
import { activityService } from "@/services/activityService";

export function useActivity() {
  const [activity, setActivity] = useState({ items: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    activityService.list().then(setActivity).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, []);

  return { activity, loading, error };
}
