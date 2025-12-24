'use client'

import { useState, useCallback, useRef } from 'react'
import { Upload, ScanLine } from 'lucide-react'
import { cn } from '@/lib/utils'

import { useRouter } from 'next/navigation'

export function UploadZone() {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback(async (file: File) => {
       // Basic validation
       if (!file.type.startsWith('image/')) {
         alert('Please upload an image file.')
         return
       }
       if (file.size > 20 * 1024 * 1024) {
         alert('File is too large (Max 20MB).')
         return
       }

       setIsUploading(true)
       
       // Dynamic import to avoid SSR issues with storage
       const { uploadImage } = await import('@/lib/storage')
       const path = await uploadImage(file)
       
       if (path) {
         router.push(`/wizard?path=${encodeURIComponent(path)}`)
       } else {
         alert('Upload failed. Please try again.')
         setIsUploading(false)
       }
  }, [router])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
       await processFile(files[0])
    }
  }, [processFile])

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          await processFile(e.target.files[0])
      }
  }, [processFile])

  const handleClick = () => {
      fileInputRef.current?.click()
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      className={cn(
        "relative border border-white/10 bg-black/50 p-10 flex flex-col items-center justify-center transition-all cursor-pointer min-h-[400px] overflow-hidden group",
        isDragging && "border-primary bg-primary/10"
      )}
    >
      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px]" />
      
      {/* Corner Markers */}
      <div className="absolute top-4 left-4 w-4 h-4 border-t border-l border-white/30" />
      <div className="absolute top-4 right-4 w-4 h-4 border-t border-r border-white/30" />
      <div className="absolute bottom-4 left-4 w-4 h-4 border-b border-l border-white/30" />
      <div className="absolute bottom-4 right-4 w-4 h-4 border-b border-r border-white/30" />

      {/* Center Target */}
      <div className="relative z-10 flex flex-col items-center group-hover:scale-105 transition-transform duration-300">
        <div className="relative mb-6">
           <div className={cn("absolute inset-0 border-2 border-primary rounded-full opacity-0 scale-150 transition-all duration-700", (isDragging || isUploading) && "opacity-100 scale-100 animate-ping")} />
           <div className="border border-primary/50 p-6 rounded-none bg-black relative overflow-hidden">
              <Upload className={cn("w-10 h-10 text-primary transition-all", isUploading && "opacity-0")} />
              {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                      <ScanLine className="w-8 h-8 text-primary animate-spin" />
                  </div>
              )}
           </div>
        </div>
        
        <h3 className="text-xl font-mono font-bold text-white uppercase tracking-widest mb-2">
          {isUploading ? "UPLOADING..." : "Start Analysis"}
        </h3>
        <p className="font-mono text-xs text-primary/70 uppercase">
          {isUploading ? "Processing..." : "[ Drag & Drop or Click to Upload ]"}
        </p>
      </div>

       <input 
          ref={fileInputRef}
          type="file" 
          className="hidden" 
          accept="image/*" 
          onChange={handleFileSelect}
       />
      
      {/* Status Footer */}
      <div className="absolute bottom-0 inset-x-0 bg-white/5 p-2 flex justify-between font-mono text-[10px] text-white/40 uppercase">
         <span className="pl-8">Format: JPG/PNG</span>
         <span className="pr-10">Max: 20MB</span>
      </div>
    </div>
  )
}
