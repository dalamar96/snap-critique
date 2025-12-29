'use client'

import { useState } from 'react'
import { CritiqueDisplay } from '@/components/critique-display'
import { CommentSection } from '@/components/comments/comment-section'
import { Comment } from '@/types/comments'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { InteractiveImage } from '@/components/comments/interactive-image'

interface AnalysisContainerProps {
    analysis: any
    analysisId: string
    isUnlocked: boolean
    imageUrl: string | null
    userCredits: number
    isGuest: boolean
    metadata: any
    comments: Comment[]
    currentUser: any
    lessonContext?: { title: string, slug: string } | null
}

export function AnalysisContainer({
    analysis,
    analysisId,
    isUnlocked,
    imageUrl,
    userCredits,
    isGuest,
    metadata,
    comments,
    currentUser,
    lessonContext
}: AnalysisContainerProps) {
    const [activePin, setActivePin] = useState<{x: number, y: number} | null>(null)
    const [isPinModalOpen, setIsPinModalOpen] = useState(false)

    const handleImageClickInModal = (x: number, y: number) => {
        setActivePin({ x, y })
        setIsPinModalOpen(false)
        // Pin is set, modal closes
    }
    
    return (
        <div className="space-y-12">
            <CritiqueDisplay 
                analysis={analysis}
                analysisId={analysisId}
                isUnlocked={isUnlocked}
                imageUrl={imageUrl}
                userCredits={userCredits}
                isGuest={isGuest}
                metadata={metadata}
                // Comments Props
                comments={comments}
                activePin={activePin}
                onImageClick={() => {}} // Main image is read-only for clicking
                isPinning={false} // Main image is not in pinning mode
                lessonContext={lessonContext}
            />

            <CommentSection 
                submissionId={analysisId}
                comments={comments}
                currentUser={currentUser}
                activePin={activePin}
                onOpenPinModal={() => setIsPinModalOpen(true)}
                onClearPin={() => setActivePin(null)}
            />

            <Dialog open={isPinModalOpen} onOpenChange={setIsPinModalOpen}>
                <DialogContent className="max-w-5xl h-[80vh] p-0 bg-black border-white/20 overflow-hidden flex items-center justify-center">
                    <DialogTitle className="sr-only">Pin Location</DialogTitle>
                    {imageUrl && (
                        <InteractiveImage 
                            src={imageUrl} 
                            comments={comments} // Show existing comments (optional, but good context)
                            activePin={activePin}
                            onImageClick={handleImageClickInModal}
                            isPinning={true}
                            className="w-full h-full"
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
