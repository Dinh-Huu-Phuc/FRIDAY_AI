import { authApi } from "@/api/authApi";

export const authService = {
  register: (payload) => authApi.register(payload),
  login: (payload) => authApi.login(payload),
  me: () => authApi.me(),
  logout: () => authApi.logout(),
  refresh: () => authApi.refresh()
};
