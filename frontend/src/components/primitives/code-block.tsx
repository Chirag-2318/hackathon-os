import * as React from "react"
import { cn } from "cn"

export interface CodeBlockProps extends React.HTMLAttributes<HTMLPreElement> {
  code: string
  language?: string
}

export function CodeBlock({ code, language, className, ...props }: CodeBlockProps) {
  return (
    <div className={cn("relative rounded-card overflow-hidden bg-sidebar text-sidebar-text", className)}>
      {language && (
        <div className="absolute top-0 right-0 px-3 py-1 text-xs font-mono text-sidebar-muted bg-black/20 rounded-bl-card">
          {language}
        </div>
      )}
      <pre
        className="p-4 overflow-x-auto text-sm font-mono leading-relaxed"
        {...props}
      >
        <code>{code}</code>
      </pre>
    </div>
  )
}
