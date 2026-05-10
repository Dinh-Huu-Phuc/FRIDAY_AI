import type { CoreCodeBlock, CoreCodePanel, CoreMarkdownSegment } from "./types"

const FENCED_CODE_BLOCK_PATTERN = /```([\w.+-]*)[ \t]*\r?\n([\s\S]*?)```/g

function normalizeLanguage(language: string | undefined) {
  return language?.trim().toLowerCase() || "text"
}

function buildSegments(reply: string) {
  const segments: CoreMarkdownSegment[] = []
  const codeBlocks: CoreCodeBlock[] = []
  let cursor = 0
  let match: RegExpExecArray | null

  FENCED_CODE_BLOCK_PATTERN.lastIndex = 0

  while ((match = FENCED_CODE_BLOCK_PATTERN.exec(reply)) !== null) {
    const [rawBlock, rawLanguage, rawCode] = match
    const textBefore = reply.slice(cursor, match.index).trim()

    if (textBefore) {
      segments.push({ type: "text", content: textBefore })
    }

    const language = normalizeLanguage(rawLanguage)
    const code = rawCode.trim()

    if (code) {
      const block = { language, code }
      codeBlocks.push(block)
      segments.push({ type: "code", ...block })
    }

    cursor = match.index + rawBlock.length
  }

  const textAfter = reply.slice(cursor).trim()
  if (textAfter) {
    segments.push({ type: "text", content: textAfter })
  }

  return { segments, codeBlocks }
}

export function extractCodePanel(reply: string): CoreCodePanel | null {
  const normalizedReply = reply.trim()
  if (!normalizedReply) return null

  const { segments, codeBlocks } = buildSegments(normalizedReply)
  if (!codeBlocks.length) return null

  return {
    title: "CODE OUTPUT",
    markdown: normalizedReply,
    language: codeBlocks.length === 1 ? codeBlocks[0].language : `${codeBlocks.length} blocks`,
    code: codeBlocks.map((block) => block.code).join("\n\n"),
    codeBlocks,
    segments,
  }
}

export function stripCodeForSpeech(reply: string) {
  const withoutCode = reply
    .replace(FENCED_CODE_BLOCK_PATTERN, "Mình đã mở phần code ở panel bên cạnh.")
    .replace(/\n{3,}/g, "\n\n")
    .trim()

  return withoutCode || "Mình đã mở phần code ở panel bên cạnh."
}
