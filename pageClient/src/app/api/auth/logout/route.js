import { NextResponse } from "next/server"
import { backendConfig, backendRequest } from "@/api/backendClient"

const ACCESS_COOKIE = "friday_access_token"
const REFRESH_COOKIE = "friday_refresh_token"
const CONNECTED_KEY_COOKIE = "friday_connected_key"

export async function POST(request) {
  const token = request.cookies.get(ACCESS_COOKIE)?.value

  if (token) {
    try {
      await backendRequest(backendConfig.paths.logout, {
        method: "POST",
        token,
      })
    } catch {
      // Logout must still clear local auth cookies if the backend is unavailable.
    }
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set(ACCESS_COOKIE, "", { path: "/", maxAge: 0 })
  response.cookies.set(REFRESH_COOKIE, "", { path: "/", maxAge: 0 })
  response.cookies.set(CONNECTED_KEY_COOKIE, "", { path: "/", maxAge: 0 })
  return response
}
