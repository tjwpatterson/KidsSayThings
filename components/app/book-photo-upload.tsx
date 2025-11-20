"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Upload, X, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import type { BookPhoto } from "@/lib/types"

interface BookPhotoUploadProps {
  bookId: string
  isOpen: boolean
  onClose: () => void
  onUploaded: (photos: BookPhoto[]) => void
}

export default function BookPhotoUpload({
  bookId,
  isOpen,
  onClose,
  onUploaded,
}: BookPhotoUploadProps) {
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const { toast } = useToast()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      setFiles((prev) => [...prev, ...selectedFiles])
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one photo to upload",
        variant: "destructive",
      })
      return
    }

    // Validate file sizes and types before upload
    const maxSize = 10 * 1024 * 1024 // 10MB
    const invalidFiles: string[] = []
    
    files.forEach((file) => {
      if (file.size > maxSize) {
        invalidFiles.push(`${file.name} (too large, max 10MB)`)
      }
      // Check if it's an image type (including HEIC)
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif']
      if (!validTypes.includes(file.type.toLowerCase()) && !file.name.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp|heic|heif)$/i)) {
        invalidFiles.push(`${file.name} (unsupported format)`)
      }
    })

    if (invalidFiles.length > 0) {
      toast({
        title: "Invalid files",
        description: invalidFiles.join(', '),
        variant: "destructive",
      })
      return
    }

    setUploading(true)

    try {
      // Upload files one at a time to avoid Vercel payload size limits
      const uploadedPhotos: BookPhoto[] = []
      const failedUploads: string[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        try {
          const formData = new FormData()
          formData.append("files", file)

          const res = await fetch(`/api/books/${bookId}/photos`, {
            method: "POST",
            body: formData,
          })

          if (!res.ok) {
            // Try to parse as JSON, but handle non-JSON responses
            let errorMessage = `Failed to upload ${file.name}`
            try {
              const contentType = res.headers.get("content-type")
              if (contentType && contentType.includes("application/json")) {
                const error = await res.json()
                errorMessage = error.error || errorMessage
              } else {
                // If not JSON, try to get text
                const text = await res.text()
                errorMessage = text || errorMessage
              }
            } catch (parseError) {
              // If parsing fails, use status text
              errorMessage = res.statusText || errorMessage
            }
            throw new Error(errorMessage)
          }

          const data = await res.json()
          if (data.photos && data.photos.length > 0) {
            uploadedPhotos.push(...data.photos)
          }
          if (data.warnings && data.warnings.length > 0) {
            failedUploads.push(...data.warnings)
          }
        } catch (error: any) {
          console.error(`Error uploading ${file.name}:`, error)
          failedUploads.push(`${file.name}: ${error.message || "Upload failed"}`)
        }
      }

      if (uploadedPhotos.length === 0) {
        throw new Error(failedUploads.length > 0 
          ? `All uploads failed: ${failedUploads.join(', ')}`
          : "Failed to upload photos")
      }

      onUploaded(uploadedPhotos)
      setFiles([])
      onClose()
      
      // Show success message with warnings if any
      if (failedUploads.length > 0) {
        toast({
          title: "Photos uploaded with warnings",
          description: `${uploadedPhotos.length} photo(s) uploaded. ${failedUploads.length} failed: ${failedUploads.slice(0, 2).join(', ')}${failedUploads.length > 2 ? '...' : ''}`,
          variant: "default",
        })
      } else {
        toast({
          title: "Photos uploaded!",
          description: `${uploadedPhotos.length} photo(s) added successfully`,
        })
      }
    } catch (error: any) {
      console.error("Upload error:", error)
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload photos. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Photos</DialogTitle>
          <DialogDescription>
            Select multiple photos to add to your book. You can upload them all at
            once.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <label htmlFor="file-upload" className="cursor-pointer">
              <span className="text-sm font-medium text-primary hover:text-primary/80">
                Click to select photos
              </span>
              <input
                id="file-upload"
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
            <p className="text-xs text-muted-foreground mt-2">
              PNG, JPG, GIF up to 10MB each
            </p>
          </div>

          {files.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Selected Photos ({files.length})</h4>
              <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                {files.map((file, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full aspect-square object-cover rounded border"
                    />
                    <button
                      onClick={() => removeFile(index)}
                      className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {file.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={uploading}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={uploading || files.length === 0}>
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload {files.length > 0 && `(${files.length})`}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

