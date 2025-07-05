export interface SQLEditMessage {
    channel_id: string
    message_id: string
    edit_number: number
    user_id: string
    old_content: string
    new_content: string
    timestamp: Date
}