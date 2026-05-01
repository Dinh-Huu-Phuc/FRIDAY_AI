"use client";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StatusBadge from "@/components/friday-platform/shared/StatusBadge";
import EmptyState from "@/components/friday-platform/shared/EmptyState";
import { formatDate } from "@/utils/dateUtils";

export default function ApiKeyTable({ keys, onRotate, onRevoke }) {
  if (!keys.length) return <EmptyState title="No API keys yet" description="Create your first FRIDAY internal gateway key." />;
  return (
    <div className="overflow-x-auto rounded-lg border border-white/10">
      <Table>
        <TableHeader>
          <TableRow><TableHead>Name</TableHead><TableHead>Status</TableHead><TableHead>Secret Key</TableHead><TableHead>Created</TableHead><TableHead>Last Used</TableHead><TableHead>Created By</TableHead><TableHead>Permissions</TableHead><TableHead>Daily Token Limit</TableHead><TableHead>Used Today</TableHead><TableHead>Actions</TableHead></TableRow>
        </TableHeader>
        <TableBody>
          {keys.map((key) => (
            <TableRow key={key.id}>
              <TableCell className="font-medium text-white">{key.name}</TableCell>
              <TableCell><StatusBadge status={key.status} /></TableCell>
              <TableCell><span className="masked-secret rounded px-2 py-1 text-xs">{key.preview}</span></TableCell>
              <TableCell>{formatDate(key.createdAt)}</TableCell>
              <TableCell>{formatDate(key.lastUsedAt)}</TableCell>
              <TableCell>{key.createdBy}</TableCell>
              <TableCell className="max-w-48 truncate">{(key.scopes || []).join(", ") || "runtime:read"}</TableCell>
              <TableCell>{key.dailyTokenLimit || "Uncapped"}</TableCell>
              <TableCell>{key.usedToday || 0}</TableCell>
              <TableCell><div className="flex gap-2"><Button size="sm" variant="secondary" onClick={() => onRotate(key)}>Rotate</Button><Button size="sm" variant="destructive" disabled={key.status === "revoked"} onClick={() => onRevoke(key)}>Revoke</Button></div></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
