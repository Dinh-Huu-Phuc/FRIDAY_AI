import { Badge } from "@/components/ui/badge";

export default function StatusBadge({ status }) {
  const variant = status === "active" ? "success" : status === "revoked" || status === "disabled" ? "danger" : status === "expired" ? "warning" : "muted";
  return <Badge variant={variant}>{status || "unknown"}</Badge>;
}
