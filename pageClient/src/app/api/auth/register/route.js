import { NextResponse } from "next/server"
import { backendConfig, backendRequest, jsonError } from "@/api/backendClient"

const ACCESS_COOKIE = "friday_access_token"
const REFRESH_COOKIE = "friday_refresh_token"

function setAuthCookies(response, payload) {
  if (payload.access_token) {
    response.cookies.set(ACCESS_COOKIE, payload.access_token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: Number(payload.expires_in || 60 * 30),
    })
  }

  if (payload.refresh_token) {
    response.cookies.set(REFRESH_COOKIE, payload.refresh_token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    if (!body.username || !body.email || !body.password) {
      return NextResponse.json(
        { message: "Username, email, and password are required." },
        { status: 400 }
      )
    }

    const payload = await backendRequest(backendConfig.paths.register, {
      method: "POST",
      body,
    })
    const response = NextResponse.json({
      user: payload.user || payload,
      auto_login: Boolean(payload.access_token),
      token_type: payload.token_type || "bearer",
      expires_in: payload.expires_in || null,
    })
    setAuthCookies(response, payload)
    return response
  } catch (error) {
    return jsonError(error, 400)
  }
}
