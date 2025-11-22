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
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 })
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

  // Helper function to convert HEIC to JPEG if needed
  const convertHeicIfNeeded = async (file: File): Promise<File> => {
    const isHeic = file.name.toLowerCase().endsWith('.heic') || 
                  file.name.toLowerCase().endsWith('.heif') ||
                  file.type === 'image/heic' || 
                  file.type === 'image/heif'
    
    if (!isHeic) {
      return file
    }

    console.log(`Converting HEIC file: ${file.name}`)
    try {
      const convertedBlob = await heic2any({
        blob: file,
        toType: "image/jpeg",
        quality: 0.92,
      })
      
      const convertedFile = convertedBlob instanceof Array ? convertedBlob[0] : convertedBlob
      const jpegFilename = file.name.replace(/\.(heic|heif)$/i, '.jpg')
      
      return new File([convertedFile], jpegFilename, {
        type: "image/jpeg",
        lastModified: file.lastModified,
      })
    } catch (conversionError) {
      console.error("HEIC conversion failed:", conversionError)
      throw new Error(`Failed to convert HEIC to JPEG: ${file.name}`)
    }
  }

  // Helper function to upload a single file
  const uploadSingleFile = async (file: File): Promise<BookPhoto> => {
    // Step 1: Convert HEIC if needed
    const processedFile = await convertHeicIfNeeded(file)

    // Step 2: Generate filename
    const timestamp = Date.now()
    const filename = `${timestamp}-${processedFile.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`

    // Step 3: Get signed upload URL from API
    const urlRes = await fetch(`/api/books/${bookId}/photos?action=get-upload-url`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename }),
    })

    if (!urlRes.ok) {
      const error = await urlRes.json().catch(() => ({ error: "Failed to get upload URL" }))
      throw new Error(error.error || "Failed to get upload URL")
    }

    const { signedUrl, token, path } = await urlRes.json()

    if (!signedUrl) {
      throw new Error("No signed URL returned")
    }

    // Step 4: Upload file to signed URL
    const uploadRes = await fetch(signedUrl, {
      method: "PUT",
      headers: {
        "Content-Type": processedFile.type || "image/jpeg",
        "x-upsert": "false",
      },
      body: processedFile,
    })

    if (!uploadRes.ok) {
      throw new Error(`Upload failed (${uploadRes.status})`)
    }

    // Step 5: Get public URL
    const supabase = createClient()
    const {
      data: { publicUrl },
    } = supabase.storage.from("attachments").getPublicUrl(path)

    if (!publicUrl) {
      throw new Error("Failed to get public URL")
    }

    // Step 6: Save photo metadata to database via API
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
      throw new Error(errorMessage)
    }

    const data = await res.json()
    if (!data.photo) {
      throw new Error("No photo data returned from API")
    }

    return data.photo
  }

  // Process files in parallel batches
  const processBatch = async (fileBatch: File[], batchNumber: number): Promise<{ success: BookPhoto[], failed: string[] }> => {
    const results = await Promise.allSettled(
      fileBatch.map((file) => uploadSingleFile(file))
    )

    const success: BookPhoto[] = []
    const failed: string[] = []

    results.forEach((result, index) => {
      const file = fileBatch[index]
      if (result.status === 'fulfilled') {
        success.push(result.value)
      } else {
        failed.push(`${file.name}: ${result.reason?.message || 'Upload failed'}`)
      }
    })

    return { success, failed }
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
    setUploadProgress({ current: 0, total: files.length })

    try {
      const uploadedPhotos: BookPhoto[] = []
      const failedUploads: string[] = []

      // Process files in parallel batches (5 at a time to avoid overwhelming the browser/server)
      const BATCH_SIZE = 5
      const batches: File[][] = []
      
      for (let i = 0; i < files.length; i += BATCH_SIZE) {
        batches.push(files.slice(i, i + BATCH_SIZE))
      }

      // Process each batch sequentially, but files within each batch in parallel
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex]
        const { success, failed } = await processBatch(batch, batchIndex + 1)
        
        uploadedPhotos.push(...success)
        failedUploads.push(...failed)
        
        // Update progress
        setUploadProgress({ 
          current: Math.min(uploadedPhotos.length + failedUploads.length, files.length), 
          total: files.length 
        })
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

          {uploading && uploadProgress.total > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Uploading photos...</span>
                <span className="font-medium">{uploadProgress.current} / {uploadProgress.total}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-300 ease-out"
                  style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

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
                      disabled={uploading}
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
                Uploading {uploadProgress.current > 0 && `${uploadProgress.current}/${uploadProgress.total}`}...
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

