'use client'

import { useState, useEffect } from 'react'
import { HardDrive, Trash2, X, RefreshCw } from 'lucide-react'
import { deleteStorageFile, getOrphanedFiles } from './actions'

interface OrphanedFile {
    name: string
    size: number
    created_at: string
    preview_url: string
}

interface StorageCleanupModalProps {
    isOpen: boolean
    onClose: () => void
}

export function StorageCleanupModal({ isOpen, onClose }: StorageCleanupModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [orphans, setOrphans] = useState<OrphanedFile[]>([])
    const [selectedImage, setSelectedImage] = useState<string | null>(null)

    const fetchOrphans = async () => {
        setIsLoading(true)
        try {
            const data = await getOrphanedFiles()
            setOrphans(data)
        } catch (e) {
            console.error(e)
            alert('Failed to load files')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (isOpen) {
            fetchOrphans()
        }
    }, [isOpen])

    const handleDelete = async (filename: string) => {
        if (!confirm('Are you sure? This will permanently delete the file.')) return
        
        try {
            const res = await deleteStorageFile(filename)
            if (res.error) {
                alert(res.error)
            } else {
                setOrphans(prev => prev.filter(f => f.name !== filename))
                if (selectedImage === filename) setSelectedImage(null)
            }
        } catch (e) {
            alert('Delete failed')
        }
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-950 border border-white/10 w-full max-w-5xl h-[80vh] flex flex-col rounded-xl overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/50">
                    <h2 className="font-bold text-white uppercase tracking-wider flex items-center gap-3">
                        <HardDrive className="w-5 h-5 text-primary" />
                        Orphaned Files ({orphans.length})
                    </h2>
                    <div className="flex items-center gap-4">
                        <button onClick={fetchOrphans} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
                            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-red-500/20 rounded-full text-slate-400 hover:text-red-500 transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden flex flex-col">
                     {/* Header Row */}
                     <div className="flex items-center gap-4 px-6 py-3 border-b border-white/10 bg-white/5 text-xs font-bold uppercase tracking-wider text-slate-400">
                         <div className="w-16">Preview</div>
                         <div className="flex-1">Filename</div>
                         <div className="w-32 text-right">Size</div>
                         <div className="w-40 text-right">Uploaded</div>
                         <div className="w-12"></div>
                     </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto p-4 content-start space-y-2">
                        {isLoading && orphans.length === 0 ? (
                            <div className="py-20 text-center text-slate-500 animate-pulse">Scanning storage...</div>
                        ) : orphans.length === 0 && !isLoading ? (
                            <div className="py-20 text-center text-green-500 flex flex-col items-center gap-2">
                                <HardDrive className="w-8 h-8 opacity-50" />
                                No orphaned files found. Clean!
                            </div>
                        ) : (
                            orphans.map(file => (
                                <div key={file.name} className="flex items-center gap-4 p-2 bg-black/40 border border-white/5 hover:bg-white/5 hover:border-white/10 rounded transition-colors group">
                                    {/* Thumbnail */}
                                    <div 
                                        className="w-16 h-16 bg-black rounded overflow-hidden cursor-zoom-in relative border border-white/10"
                                        onClick={() => setSelectedImage(file.preview_url)}
                                    >
                                        <img 
                                            src={file.preview_url} 
                                            alt={file.name} 
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    
                                    {/* Name */}
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-mono text-white truncate" title={file.name}>{file.name}</div>
                                    </div>

                                    {/* Size */}
                                    <div className="w-32 text-right text-xs text-slate-500 font-mono">
                                        {(file.size / 1024).toFixed(1)} KB
                                    </div>

                                    {/* Date */}
                                    <div className="w-40 text-right text-xs text-slate-500 font-mono">
                                        {new Date(file.created_at).toLocaleDateString()}
                                        <span className="block text-[10px] opacity-50">{new Date(file.created_at).toLocaleTimeString()}</span>
                                    </div>

                                    {/* Delete Button */}
                                    <div className="w-12 flex justify-end">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleDelete(file.name); }}
                                            className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                                            title="Delete both upload and preview"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Lightbox */}
            {selectedImage && (
                <div 
                    className="fixed inset-0 z-[110] bg-black/95 flex items-center justify-center p-4 cursor-zoom-out"
                    onClick={() => setSelectedImage(null)}
                >
                    <img 
                        src={selectedImage} 
                        alt="Preview" 
                        className="max-w-full max-h-full object-contain rounded shadow-2xl border border-white/10"
                    />
                    <button className="absolute top-4 right-4 text-white/50 hover:text-white">
                        <X className="w-8 h-8" />
                    </button>
                </div>
            )}
        </div>
    )
}
