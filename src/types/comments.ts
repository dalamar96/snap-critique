export type CommentType = 'general' | 'critique' | 'praise' | 'question' | 'suggestion'

export interface Comment {
    id: string
    submission_id: string
    user_id: string
    text: string
    category: CommentType
    location_x?: number
    location_y?: number
    created_at: string
    profiles?: {
        full_name: string | null
        avatar_url: string | null
        username?: string | null
    }
}
