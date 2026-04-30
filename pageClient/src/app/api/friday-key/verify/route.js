import { NextResponse } from "next/server"
import { backendConfig, backendRequest, jsonError } from "@/api/backendClient"
import { normalizeKeyMetadata } from "@/utils/apiKeyMask"

const ACCESS_COOKIE = "friday_access_token"
const CONNECTED_KEY_COOKIE = "friday_connected_key"

export async function POST(request) {
  try {
    const token = request.cookies.get(ACCESS_COOKIE)?.value
    if (!token) {
      return NextResponse.json(
        { message: "Please login before connecting an API key." },
        { status: 401 }
      )
    }

    const body = await request.json()
    const apiKey = String(body.api_key || "").trim()
    if (!apiKey) {
      return NextResponse.json({ message: "FRIDAY API key is required." }, { status: 400 })
    }

    // Backend must verify key_hash, status, expiration, scopes, and owner_user_id.
    const payload = await backendRequest(backendConfig.paths.verifyKey, {
      method: "POST",
      token,
      body: { api_key: apiKey },
    })

    if (payload.valid === false) {
      return NextResponse.json(
        {
          message:
            "This API key is invalid, revoked, expired, or does not belong to your account.",
        },
        { status: 403 }
      )
    }

    const keyMetadata = normalizeKeyMetadata(payload)
    const response = NextResponse.json({ connected: true, key: keyMetadata })
    response.cookies.set(CONNECTED_KEY_COOKIE, JSON.stringify(keyMetadata), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    })
    return response
  } catch (error) {
    if (error.status === 404) {
      return NextResponse.json(
        {
          message:
            "Backend API key verification route is not available yet. Expected /api/v1/api-keys/verify.",
          code: "VERIFY_ROUTE_MISSING",
        },
        { status: 501 }
      )
    }
    return jsonError(error, error.status || 403)
  }
}
