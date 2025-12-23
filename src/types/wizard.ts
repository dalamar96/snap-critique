export type PhotographyCategory =
    | 'portrait'
    | 'landscape'
    | 'street'
    | 'wildlife'
    | 'macro'
    | 'product'
    | 'architecture'
    | 'event'
    | 'other';

export type UserGoal =
    | 'composition'
    | 'lighting'
    | 'posing'
    | 'editing'
    | 'storytelling'
    | 'technical';

export interface WizardState {
    file: File | null;
    category: PhotographyCategory | null;
    goals: UserGoal[];
    context: string; // "What do you want feedback on?" free text
}
