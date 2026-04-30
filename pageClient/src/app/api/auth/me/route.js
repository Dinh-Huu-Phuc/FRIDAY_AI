import { NextResponse } from "next/server"
import { backendConfig, backendRequest, jsonError } from "@/api/backendClient"

const ACCESS_COOKIE = "friday_access_token"

export async function GET(request) {
  try {
    const token = request.cookies.get(ACCESS_COOKIE)?.value
    if (!token) {
      return NextResponse.json({ message: "Not authenticated." }, { status: 401 })
    }

    const payload = await backendRequest(backendConfig.paths.me, { token })
    return NextResponse.json({ user: payload.user || payload })
  } catch (error) {
    return jsonError(error, 401)
  }
}
