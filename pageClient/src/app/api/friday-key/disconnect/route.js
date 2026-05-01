import { NextResponse } from "next/server"

const CONNECTED_KEY_COOKIE = "friday_connected_key"

export async function POST() {
  const response = NextResponse.json({ ok: true, connected: false })
  response.cookies.set(CONNECTED_KEY_COOKIE, "", { path: "/", maxAge: 0 })
  return response
}
