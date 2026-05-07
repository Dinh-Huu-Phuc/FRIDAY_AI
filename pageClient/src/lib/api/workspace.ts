import { requestJson } from "@/lib/api"

export type WorkspaceFileSummary = {
  path: string
  size_bytes: number
  kind: string
}

export type WorkspaceBlockedRule = {
  rule: string
  reason: string
}

export type WorkspaceIndexResponse = {
  ok: boolean
  root: string
  allowed_roots: string[]
  blocked_rules: WorkspaceBlockedRule[]
  files: WorkspaceFileSummary[]
  truncated: boolean
}

export type WorkspaceReadResponse = {
  ok: boolean
  path: string
  content: string
  truncated: boolean
  blocked: boolean
  reason?: string | null
}

export type WorkspaceSearchMatch = {
  path: string
  line: number
  snippet: string
}

export type WorkspaceSearchResponse = {
  ok: boolean
  query: string
  matches: WorkspaceSearchMatch[]
  truncated: boolean
}

const emptyIndex: WorkspaceIndexResponse = {
  ok: false,
  root: "",
  allowed_roots: [],
  blocked_rules: [],
  files: [],
  truncated: false,
}

export async function indexWorkspace(maxFiles = 240) {
  return requestJson<WorkspaceIndexResponse>({
    path: "/agent/workspace/index",
    method: "POST",
    body: { max_files: maxFiles },
    fallback: emptyIndex,
  })
}

export async function readWorkspaceFile(path: string, maxChars = 12000) {
  return requestJson<WorkspaceReadResponse>({
    path: "/agent/workspace/read",
    method: "POST",
    body: { path, max_chars: maxChars },
    fallback: {
      ok: false,
      path,
      content: "",
      truncated: false,
      blocked: false,
      reason: "Workspace backend is unavailable.",
    },
  })
}

export async function searchWorkspace(query: string, maxResults = 12) {
  return requestJson<WorkspaceSearchResponse>({
    path: "/agent/workspace/search",
    method: "POST",
    body: { query, max_results: maxResults },
    fallback: {
      ok: false,
      query,
      matches: [],
      truncated: false,
    },
  })
}
