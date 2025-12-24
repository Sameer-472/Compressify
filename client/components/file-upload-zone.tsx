"use client"

import type React from "react"

import { useCallback } from "react"
import { Upload } from "lucide-react"
import { cn } from "@/lib/utils"

interface FileUploadZoneProps {
  onFilesSelected: (files: File[]) => void
  disabled?: boolean
}

export function FileUploadZone({ onFilesSelected, disabled }: FileUploadZoneProps) {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      if (disabled) return

      const files = Array.from(e.dataTransfer.files).filter(
        (file) => file.type.startsWith("image/") || file.type.startsWith("video/"),
      )

      if (files.length > 0) {
        onFilesSelected(files)
      }
    },
    [onFilesSelected, disabled],
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return
      const files = Array.from(e.target.files || [])
      if (files.length > 0) {
        onFilesSelected(files)
      }
    },
    [onFilesSelected, disabled],
  )

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className={cn(
        "relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg transition-colors",
        disabled
          ? "border-border bg-muted cursor-not-allowed opacity-60"
          : "border-primary/30 bg-primary/5 hover:border-primary/50 hover:bg-primary/10 cursor-pointer",
      )}
    >
      <input
        type="file"
        multiple
        accept="image/*,video/*"
        onChange={handleFileInput}
        disabled={disabled}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
      />
      <div className="flex flex-col items-center gap-4 pointer-events-none">
        <div className="p-4 rounded-full bg-primary/10">
          <Upload className="w-8 h-8 text-primary" />
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground">Drop files here or click to browse</p>
          <p className="text-sm text-muted-foreground mt-1">Support for images and videos</p>
        </div>
      </div>
    </div>
  )
}
