export type CoreCodeBlock = {
  language: string
  code: string
}

export type CoreMarkdownSegment =
  | {
      type: "text"
      content: string
    }
  | {
      type: "code"
      language: string
      code: string
    }

export type CoreCodePanel = {
  title: string
  markdown: string
  language: string
  code: string
  codeBlocks: CoreCodeBlock[]
  segments: CoreMarkdownSegment[]
}
