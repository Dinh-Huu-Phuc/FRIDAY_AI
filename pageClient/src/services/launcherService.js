import * as launcherApi from "@/api/launcherApi"

export function searchApps(query, limit) {
  return launcherApi.searchWindowsApps(query, limit)
}

export function openApp(payload) {
  return launcherApi.openWindowsApp(payload)
}
