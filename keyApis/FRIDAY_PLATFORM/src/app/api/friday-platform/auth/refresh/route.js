import { cookies } from "next/headers";
import { apiConfig } from "@/api/apiConfig";
import { backendRequest, routeError } from "@/api/backendClient";

export async function POST() {
  try {
    const jar = await cookies();
    const refreshToken = jar.get("friday_refresh_token")?.value;
    if (!refreshToken) return Response.json({ ok: false, message: "Missing refresh token." }, { status: 401 });
    const data = await backendRequest(apiConfig.paths.refresh, { method: "POST", body: { refresh_token: refreshToken } });
    if (data.access_token) jar.set("friday_access_token", data.access_token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: data.expires_in || 1800 });
    if (data.refresh_token) jar.set("friday_refresh_token", data.refresh_token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30 });
    return Response.json({ ok: true, user: data.user || null });
  } catch (error) {
    return routeError(error);
  }
}
