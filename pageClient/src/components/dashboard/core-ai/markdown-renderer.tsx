import { memo } from "react"
import ReactMarkdown, { type Components } from "react-markdown"
import remarkGfm from "remark-gfm"
import { SyntaxCodeBlock } from "./syntax-code-block"
import styles from "./code-panel.module.css"

type MarkdownRendererProps = {
  markdown: string
}

function languageFromClassName(className: string | undefined) {
  return /language-([\w.+-]+)/.exec(className ?? "")?.[1]?.toLowerCase()
}

const remarkPlugins = [remarkGfm]

const components: Components = {
  pre({ children }) {
    return <>{children}</>
  },
  code({ className, children, ...props }) {
    const language = languageFromClassName(className)
    const code = String(children)

    if (language) {
      return <SyntaxCodeBlock code={code} language={language} />
    }

    return (
      <code className={styles.inlineCode} {...props}>
        {children}
      </code>
    )
  },
}

export const MarkdownRenderer = memo(function MarkdownRenderer({ markdown }: MarkdownRendererProps) {
  return (
    <div className={styles.markdown}>
      <ReactMarkdown remarkPlugins={remarkPlugins} components={components}>
        {markdown}
      </ReactMarkdown>
    </div>
  )
})
