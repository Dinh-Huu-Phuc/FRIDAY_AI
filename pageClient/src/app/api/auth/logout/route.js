import { NextResponse } from "next/server"
import { backendConfig, backendRequest } from "@/api/backendClient"
import { ACCESS_COOKIE, REFRESH_COOKIE, clearAuthCookies } from "@/api/authCookies"

export async function POST(request) {
  const token = request.cookies.get(ACCESS_COOKIE)?.value
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value

  if (token || refreshToken) {
    try {
      await backendRequest(backendConfig.paths.logout, {
        method: "POST",
        token,
        body: { refresh_token: refreshToken || null },
      })
    } catch {
      // Logout must still clear local auth cookies if the backend is unavailable.
    }
  }

  const response = NextResponse.json({ ok: true })
  clearAuthCookies(response)
  return response
}
