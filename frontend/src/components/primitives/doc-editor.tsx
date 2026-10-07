import * as React from "react"
import { cn } from "cn"

export interface DocEditorProps extends React.HTMLAttributes<HTMLDivElement> {
  initialTitle?: string
  initialContent?: string
}

export function DocEditor({ initialTitle = "", initialContent = "", className, ...props }: DocEditorProps) {
  return (
    <div className={cn("flex flex-col bg-surface-raised rounded-card shadow-e1 p-8 h-full max-w-4xl mx-auto w-full", className)} {...props}>
      <input
        type="text"
        defaultValue={initialTitle}
        placeholder="Document Title"
        className="w-full bg-transparent text-h1 font-bold text-ink placeholder:text-ink-muted focus:outline-none mb-6"
      />
      <textarea
        defaultValue={initialContent}
        placeholder="Start typing..."
        className="w-full h-full flex-1 resize-none bg-transparent text-body text-ink placeholder:text-ink-muted focus:outline-none"
      />
    </div>
  )
}
