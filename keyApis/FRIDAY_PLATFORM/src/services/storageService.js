import { storageApi } from "@/api/storageApi";

export const storageService = {
  get: () => storageApi.get()
};
