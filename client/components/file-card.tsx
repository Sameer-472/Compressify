"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { X, ImageIcon, Video, CheckCircle2, Loader2 } from "lucide-react"
import { formatFileSize } from "@/lib/compression"
import type { CompressionResult } from "@/lib/compression"

interface FileCardProps {
  file: File
  onRemove: () => void
  compressionResult?: CompressionResult
  isCompressing?: boolean
  compressionProgress?: number
}

export function FileCard({ file, onRemove, compressionResult, isCompressing, compressionProgress = 0 }: FileCardProps) {
  const [imagePreview, setImagePreview] = useState<string>()

  // Generate preview for images
  if (file.type.startsWith("image/") && !imagePreview) {
    const reader = new FileReader()
    reader.onloadend = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const isVideo = file.type.startsWith("video/")
  const Icon = isVideo ? Video : ImageIcon

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Preview/Icon */}
          <div className="flex-shrink-0">
            {imagePreview ? (
              <img
                src={imagePreview || "/placeholder.svg"}
                alt={file.name}
                className="w-16 h-16 object-cover rounded-md"
              />
            ) : (
              <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center">
                <Icon className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* File Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{formatFileSize(file.size)}</p>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={onRemove} className="flex-shrink-0">
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Compression Status */}
            {isCompressing && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Compressing...
                  </span>
                  <span className="font-medium">{compressionProgress}%</span>
                </div>
                <Progress value={compressionProgress} className="h-1.5" />
              </div>
            )}

            {/* Compression Result */}
            {compressionResult && !isCompressing && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-xs text-green-600 font-medium">Compressed successfully</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground">Original: </span>
                    <span className="font-medium">{formatFileSize(compressionResult.originalSize)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Compressed: </span>
                    <span className="font-medium">{formatFileSize(compressionResult.compressedSize)}</span>
                  </div>
                  <Badge variant="secondary" className="ml-auto">
                    {compressionResult.compressionRatio}% saved
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
