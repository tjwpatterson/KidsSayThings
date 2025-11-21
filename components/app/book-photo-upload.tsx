"use client"

import { useState, useRef } from "react"
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
import { createClient } from "@/lib/supabase/client"
import type { BookPhoto } from "@/lib/types"
import heic2any from "heic2any"

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
  const [isDragging, setIsDragging] = useState(false)
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      setFiles((prev) => [...prev, ...selectedFiles])
    }
  }

  const addFiles = (fileList: FileList | File[]) => {
    const fileArray = Array.from(fileList)
    setFiles((prev) => [...prev, ...fileArray])
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const droppedFiles = e.dataTransfer.files
    if (droppedFiles.length > 0) {
      addFiles(droppedFiles)
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
      const supabase = createClient()
      const uploadedPhotos: BookPhoto[] = []
      const failedUploads: string[] = []

      // Upload files using signed URLs (bypasses storage policies)
      for (let i = 0; i < files.length; i++) {
        let file = files[i]
        try {
          // Convert HEIC/HEIF to JPEG if needed
          const isHeic = file.name.toLowerCase().endsWith('.heic') || 
                        file.name.toLowerCase().endsWith('.heif') ||
                        file.type === 'image/heic' || 
                        file.type === 'image/heif'
          
          if (isHeic) {
            console.log(`Converting HEIC file: ${file.name}`)
            try {
              const convertedBlob = await heic2any({
                blob: file,
                toType: "image/jpeg",
                quality: 0.92, // High quality
              })
              
              // heic2any returns an array, get the first item
              const convertedFile = convertedBlob instanceof Array ? convertedBlob[0] : convertedBlob
              
              // Create a new File object with JPEG extension
              const jpegFilename = file.name.replace(/\.(heic|heif)$/i, '.jpg')
              file = new File([convertedFile], jpegFilename, {
                type: "image/jpeg",
                lastModified: file.lastModified,
              })
              console.log(`Converted to JPEG: ${jpegFilename}`)
            } catch (conversionError) {
              console.error("HEIC conversion failed:", conversionError)
              failedUploads.push(`${file.name}: Failed to convert HEIC to JPEG`)
              continue
            }
          }

          // Generate filename
          const timestamp = Date.now()
          const filename = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`

          // Step 1: Get signed upload URL from API
          const urlRes = await fetch(`/api/books/${bookId}/photos?action=get-upload-url`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ filename }),
          })

          if (!urlRes.ok) {
            const error = await urlRes.json().catch(() => ({ error: "Failed to get upload URL" }))
            failedUploads.push(`${file.name}: ${error.error || "Failed to get upload URL"}`)
            continue
          }

          const { signedUrl, token, path } = await urlRes.json()

          if (!signedUrl) {
            failedUploads.push(`${file.name}: No signed URL returned`)
            continue
          }

          // Step 2: Upload file to signed URL
          const uploadRes = await fetch(signedUrl, {
            method: "PUT",
            headers: {
              "Content-Type": file.type || "image/jpeg",
              "x-upsert": "false",
            },
            body: file,
          })

          if (!uploadRes.ok) {
            failedUploads.push(`${file.name}: Upload failed (${uploadRes.status})`)
            continue
          }

          // Step 3: Get public URL and save metadata
          const supabase = createClient()
          const {
            data: { publicUrl },
          } = supabase.storage.from("attachments").getPublicUrl(path)

          if (!publicUrl) {
            failedUploads.push(`${file.name}: Failed to get public URL`)
            continue
          }

          // Step 4: Save photo metadata to database via API
          const res = await fetch(`/api/books/${bookId}/photos`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              url: publicUrl,
              filename: filename,
              path: path,
            }),
          })

          if (!res.ok) {
            let errorMessage = "Failed to save photo metadata"
            try {
              const error = await res.json()
              errorMessage = error.error || errorMessage
            } catch (e) {
              errorMessage = res.statusText || errorMessage
            }
            console.error(`API error for ${file.name}:`, errorMessage)
            failedUploads.push(`${file.name}: ${errorMessage}`)
            continue
          }

          const data = await res.json()
          if (data.photo) {
            uploadedPhotos.push(data.photo)
          } else {
            failedUploads.push(`${file.name}: No photo data returned from API`)
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
          <div
            ref={dropZoneRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted hover:border-muted-foreground/50"
            }`}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <label htmlFor="file-upload" className="cursor-pointer">
              <span className="text-sm font-medium text-primary hover:text-primary/80">
                {isDragging ? "Drop photos here" : "Click to select photos or drag and drop"}
              </span>
              <input
                ref={fileInputRef}
                id="file-upload"
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
            <p className="text-xs text-muted-foreground mt-2">
              PNG, JPG, HEIC, GIF up to 10MB each
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

