import * as React from "react"
import { cn } from "cn"
import { UploadCloud } from "lucide-react"

export interface DropzoneProps extends React.HTMLAttributes<HTMLDivElement> {
  onDrop?: (e: React.DragEvent<HTMLDivElement>) => void
  isDragging?: boolean
}

export function Dropzone({ className, children, onDrop, isDragging = false, ...props }: DropzoneProps) {
  const [dragActive, setDragActive] = React.useState(isDragging)

  const handleDrag = function (e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = function (e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onDrop?.(e)
    }
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 rounded-card border-2 border-dashed transition-colors",
        dragActive
          ? "border-primary bg-surface-sunken"
          : "border-border-strong bg-transparent hover:bg-surface-sunken/50",
        className
      )}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      {...props}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-surface mb-4">
        <UploadCloud className="h-6 w-6 text-ink-muted" />
      </div>
      {children ?? (
        <>
          <p className="text-body font-medium text-ink mb-1">Click to upload or drag and drop</p>
          <p className="text-body text-ink-muted text-sm">SVG, PNG, JPG or GIF (max. 800x400px)</p>
        </>
      )}
    </div>
  )
}
