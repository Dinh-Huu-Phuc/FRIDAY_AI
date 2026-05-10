"use client"

import { memo, useCallback, useState } from "react"
import { MarkdownRenderer } from "./markdown-renderer"
import type { CoreCodePanel } from "./types"
import styles from "./code-panel.module.css"

type CoreAICodePanelProps = {
  panel: CoreCodePanel
  onClose: () => void
}

export const CoreAICodePanel = memo(function CoreAICodePanel({ panel, onClose }: CoreAICodePanelProps) {
  const [copyLabel, setCopyLabel] = useState("COPY")

  const copyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(panel.code)
      setCopyLabel("COPIED")
      window.setTimeout(() => setCopyLabel("COPY"), 1200)
    } catch {
      setCopyLabel("FAILED")
      window.setTimeout(() => setCopyLabel("COPY"), 1200)
    }
  }, [panel.code])

  return (
    <aside className={styles.panel} aria-label={panel.title}>
      <header className={styles.header}>
        <div className={styles.heading}>
          <span>{panel.title}</span>
          <strong>{panel.language}</strong>
        </div>
        <div className={styles.actions}>
          <button type="button" onClick={copyCode}>
            {copyLabel}
          </button>
          <button type="button" onClick={onClose}>
            CLOSE
          </button>
        </div>
      </header>

      <div className={styles.body}>
        <span className={styles.meta}>
          {panel.codeBlocks.length} block{panel.codeBlocks.length === 1 ? "" : "s"}
        </span>
        <MarkdownRenderer markdown={panel.markdown} />
      </div>
    </aside>
  )
})
