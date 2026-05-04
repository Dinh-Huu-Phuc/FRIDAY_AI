import { NextResponse } from "next/server"
import { backendConfig, backendRequest, jsonError } from "@/api/backendClient"
import { REFRESH_COOKIE, extractCookieValue, setAccessCookie, setRefreshCookie } from "@/api/authCookies"

export async function POST(request) {
  try {
    const body = await request.json()
    if (!body.username || !body.email || !body.password) {
      return NextResponse.json(
        { message: "Username, email, and password are required." },
        { status: 400 }
      )
    }

    const { data: payload, response: backendResponse } = await backendRequest(backendConfig.paths.register, {
      method: "POST",
      body,
      includeResponse: true,
    })
    const response = NextResponse.json({
      user: payload.user || payload,
      auto_login: Boolean(payload.access_token),
      token_type: payload.token_type || "bearer",
      expires_in: payload.expires_in || null,
    })
    setAccessCookie(response, payload)
    setRefreshCookie(response, extractCookieValue(backendResponse.headers.get("set-cookie"), REFRESH_COOKIE))
    return response
  } catch (error) {
    return jsonError(error, 400)
  }
}
