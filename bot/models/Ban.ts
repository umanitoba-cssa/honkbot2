export interface Ban {
    id: string
    collectionId: string
    collectionName: string
    created: string
    updated: string
    guild_id: string
    target_user_id: string
    issuer_user_id: string
    reason: string
    automatic: boolean
}