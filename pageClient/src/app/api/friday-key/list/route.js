import { NextResponse } from "next/server"
import { backendConfig, backendRequest, jsonError } from "@/api/backendClient"
import { normalizeKeyList } from "@/utils/apiKeyMask"

const ACCESS_COOKIE = "friday_access_token"

export async function GET(request) {
  try {
    const token = request.cookies.get(ACCESS_COOKIE)?.value
    if (!token) {
      return NextResponse.json({ message: "Please login before listing API keys." }, { status: 401 })
    }

    const payload = await backendRequest(backendConfig.paths.apiKeys, { token })
    return NextResponse.json({ items: normalizeKeyList(payload) })
  } catch (error) {
    return jsonError(error, error.status || 500)
  }
}
