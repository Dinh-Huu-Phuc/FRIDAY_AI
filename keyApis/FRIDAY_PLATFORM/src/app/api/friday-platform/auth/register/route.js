import { cookies } from "next/headers";
import { apiConfig } from "@/api/apiConfig";
import { backendRequest, routeError } from "@/api/backendClient";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/"
};

export async function POST(request) {
  try {
    const payload = await request.json();
    if (!payload.username || !payload.email || !payload.password) {
      return Response.json({ ok: false, message: "Missing register fields." }, { status: 400 });
    }
    const data = await backendRequest(apiConfig.paths.register, { method: "POST", body: payload });
    const jar = await cookies();
    if (data.access_token) jar.set("friday_access_token", data.access_token, { ...cookieOptions, maxAge: data.expires_in || 1800 });
    if (data.refresh_token) jar.set("friday_refresh_token", data.refresh_token, { ...cookieOptions, maxAge: 60 * 60 * 24 * 30 });
    return Response.json({ ok: true, user: data.user || null, autoLogin: Boolean(data.access_token) });
  } catch (error) {
    return routeError(error);
  }
}
