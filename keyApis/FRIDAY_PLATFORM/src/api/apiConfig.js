export const apiConfig = {
  backendUrl: process.env.BACKEND_URL || "http://localhost:8001",
  paths: {
    register: process.env.BACKEND_REGISTER_PATH || "/api/v1/auth/register",
    login: process.env.BACKEND_LOGIN_PATH || "/api/v1/auth/login",
    me: process.env.BACKEND_ME_PATH || "/api/v1/auth/me",
    logout: process.env.BACKEND_LOGOUT_PATH || "/api/v1/auth/logout",
    refresh: process.env.BACKEND_REFRESH_PATH || "/api/v1/auth/refresh",
    apiKeys: process.env.BACKEND_API_KEYS_PATH || "/api/v1/api-keys",
    usage: process.env.BACKEND_USAGE_PATH || "/api/v1/usage",
    storage: process.env.BACKEND_STORAGE_PATH || "/api/v1/storage",
    activity: process.env.BACKEND_ACTIVITY_PATH || "/api/v1/activity"
  }
};

export function backendUrl(path) {
  return `${apiConfig.backendUrl}${path}`;
}
