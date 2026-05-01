import { apiKeysApi } from "@/api/apiKeysApi";

export const apiKeyService = {
  list: () => apiKeysApi.list(),
  create: (payload) => apiKeysApi.create(payload),
  rotate: (keyId) => apiKeysApi.rotate(keyId),
  revoke: (keyId) => apiKeysApi.revoke(keyId),
  delete: (keyId) => apiKeysApi.delete(keyId)
};
