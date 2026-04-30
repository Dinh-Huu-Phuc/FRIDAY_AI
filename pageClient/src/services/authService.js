import * as authApi from "@/api/authApi"

export function login(payload) {
  return authApi.login(payload)
}

export function register(payload) {
  return authApi.register(payload)
}

export function getCurrentUser() {
  return authApi.me()
}

export function logout() {
  return authApi.logout()
}

export function refreshSession() {
  return authApi.refresh()
}
