import { usageApi } from "@/api/usageApi";

export const usageService = {
  get: () => usageApi.get()
};
