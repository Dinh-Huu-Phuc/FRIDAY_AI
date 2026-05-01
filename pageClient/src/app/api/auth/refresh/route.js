import { NextResponse } from "next/server"
import { backendConfig, backendRequest, jsonError } from "@/api/backendClient"

const ACCESS_COOKIE = "friday_access_token"
const REFRESH_COOKIE = "friday_refresh_token"

export async function POST(request) {
  try {
    const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value
    if (!refreshToken) {
      return NextResponse.json({ message: "Refresh token is missing." }, { status: 401 })
    }

    const payload = await backendRequest(backendConfig.paths.refresh, {
      method: "POST",
      body: { refresh_token: refreshToken },
    })
    const response = NextResponse.json({
      user: payload.user || null,
      token_type: payload.token_type || "bearer",
      expires_in: payload.expires_in || null,
    })

    if (payload.access_token) {
      response.cookies.set(ACCESS_COOKIE, payload.access_token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: Number(payload.expires_in || 60 * 30),
      })
    }

    return response
  } catch (error) {
    return jsonError(error, 401)
  }
}
