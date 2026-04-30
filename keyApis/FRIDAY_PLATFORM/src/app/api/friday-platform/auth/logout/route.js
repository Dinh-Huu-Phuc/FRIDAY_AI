import { cookies } from "next/headers";
import { apiConfig } from "@/api/apiConfig";
import { backendRequest } from "@/api/backendClient";

export async function POST() {
  const jar = await cookies();
  const token = jar.get("friday_access_token")?.value;
  const refreshToken = jar.get("friday_refresh_token")?.value;
  if (token && refreshToken) {
    await backendRequest(apiConfig.paths.logout, { method: "POST", token, body: { refresh_token: refreshToken } }).catch(() => null);
  }
  jar.delete("friday_access_token");
  jar.delete("friday_refresh_token");
  return Response.json({ ok: true });
}
