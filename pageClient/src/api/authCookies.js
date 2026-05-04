export const ACCESS_COOKIE = "friday_access_token"
export const REFRESH_COOKIE = "friday_refresh_token"
export const CONNECTED_KEY_COOKIE = "friday_connected_key"

export const ACCESS_COOKIE_PATH = "/api"
export const REFRESH_COOKIE_PATH = "/api/auth"

export function authCookieOptions(maxAge, path) {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path,
    maxAge,
  }
}

export function setAccessCookie(response, payload) {
  if (!payload.access_token) return
  response.cookies.set(
    ACCESS_COOKIE,
    payload.access_token,
    authCookieOptions(Number(payload.expires_in || 60 * 30), ACCESS_COOKIE_PATH)
  )
}

export function setRefreshCookie(response, refreshToken, maxAge = 60 * 60 * 24 * 7) {
  if (!refreshToken) return
  response.cookies.set(REFRESH_COOKIE, refreshToken, authCookieOptions(maxAge, REFRESH_COOKIE_PATH))
}

export function clearAuthCookies(response) {
  response.cookies.set(ACCESS_COOKIE, "", { path: ACCESS_COOKIE_PATH, maxAge: 0 })
  response.cookies.set(REFRESH_COOKIE, "", { path: REFRESH_COOKIE_PATH, maxAge: 0 })
  response.cookies.set(ACCESS_COOKIE, "", { path: "/", maxAge: 0 })
  response.cookies.set(REFRESH_COOKIE, "", { path: "/", maxAge: 0 })
  response.cookies.set(CONNECTED_KEY_COOKIE, "", { path: "/", maxAge: 0 })
}

export function extractCookieValue(setCookieHeader, name) {
  if (!setCookieHeader) return null
  const pattern = new RegExp(`(?:^|,\\s*)${name}=([^;]*)`)
  const match = setCookieHeader.match(pattern)
  return match ? decodeURIComponent(match[1]) : null
}
