"use client"

import { memo, useCallback, useMemo, useState, type CSSProperties } from "react"
import { PrismAsyncLight as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism"
import styles from "./code-panel.module.css"

type SyntaxCodeBlockProps = {
  code: string
  language: string
}

const highlighterStyle: CSSProperties = {
  margin: 0,
  padding: "14px 0",
  background: "transparent",
  fontSize: "0.82rem",
  lineHeight: 1.6,
}

const codeTagProps = {
  style: {
    fontFamily: "var(--font-geist-mono)",
  },
}

const lineNumberStyle: CSSProperties = {
  minWidth: "2.75em",
  paddingRight: "1em",
  color: "rgba(255, 255, 255, 0.34)",
  textAlign: "right",
  userSelect: "none",
}

export const SyntaxCodeBlock = memo(function SyntaxCodeBlock({ code, language }: SyntaxCodeBlockProps) {
  const [copyLabel, setCopyLabel] = useState("COPY")
  const normalizedCode = useMemo(() => code.replace(/\n$/, ""), [code])
  const lineCount = useMemo(
    () => (normalizedCode ? normalizedCode.split(/\r?\n/).length : 0),
    [normalizedCode]
  )

  const copyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(normalizedCode)
      setCopyLabel("COPIED")
      window.setTimeout(() => setCopyLabel("COPY"), 1200)
    } catch {
      setCopyLabel("FAILED")
      window.setTimeout(() => setCopyLabel("COPY"), 1200)
    }
  }, [normalizedCode])

  return (
    <section className={styles.codeBlock}>
      <div className={styles.codeHead}>
        <span>{language}</span>
        <div className={styles.codeMeta}>
          <span>{lineCount} lines</span>
          <button type="button" onClick={copyCode}>
            {copyLabel}
          </button>
        </div>
      </div>
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        showLineNumbers
        wrapLongLines={false}
        customStyle={highlighterStyle}
        codeTagProps={codeTagProps}
        lineNumberStyle={lineNumberStyle}
      >
        {normalizedCode}
      </SyntaxHighlighter>
    </section>
  )
})
