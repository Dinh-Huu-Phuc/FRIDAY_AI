import { NextResponse } from "next/server"

const CONNECTED_KEY_COOKIE = "friday_connected_key"

export async function GET(request) {
  const raw = request.cookies.get(CONNECTED_KEY_COOKIE)?.value
  if (!raw) {
    return NextResponse.json({ connected: false, key: null })
  }

  try {
    return NextResponse.json({ connected: true, key: JSON.parse(raw) })
  } catch {
    const response = NextResponse.json({ connected: false, key: null })
    response.cookies.set(CONNECTED_KEY_COOKIE, "", { path: "/", maxAge: 0 })
    return response
  }
}
