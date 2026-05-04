import { NextResponse } from "next/server"
import { backendConfig, backendRequest, jsonError } from "@/api/backendClient"
import { REFRESH_COOKIE, extractCookieValue, setAccessCookie, setRefreshCookie } from "@/api/authCookies"

export async function POST(request) {
  try {
    const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value
    if (!refreshToken) {
      return NextResponse.json({ message: "Refresh token is missing." }, { status: 401 })
    }

    const { data: payload, response: backendResponse } = await backendRequest(backendConfig.paths.refresh, {
      method: "POST",
      body: { refresh_token: refreshToken },
      includeResponse: true,
    })
    const response = NextResponse.json({
      user: payload.user || null,
      token_type: payload.token_type || "bearer",
      expires_in: payload.expires_in || null,
    })

    setAccessCookie(response, payload)
    setRefreshCookie(response, extractCookieValue(backendResponse.headers.get("set-cookie"), REFRESH_COOKIE))

    return response
  } catch (error) {
    return jsonError(error, 401)
  }
}
