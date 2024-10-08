export default interface GuildSettings {
    id: string
    collectionId: string
    collectionName: string
    created: string
    updated: string
    guild_id: string
    verification_logs_channel_id: string
    verification_info_channel_id: string
    preverified_role_id: string
    verified_role_id: string
    student_role_id: string
    alumni_role_id: string
    instructor_role_id: string
    guest_role_id: string
    verification_email_endpoint: string
    role_select_channel_id: string
    voteban_channel_id: string
    modlog_channel_id: string
    modmail_channel_id: string
    welcome_channel_id: string
    max_strikes: number
  }
  