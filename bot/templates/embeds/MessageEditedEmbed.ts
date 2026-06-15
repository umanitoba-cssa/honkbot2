import { Client, EmbedBuilder, Message } from "discord.js";
import type { SQLMessage } from "../../models/SQLMessage";

function truncate(text: string, max: number) {
    return text.length > max ? text.slice(0, Math.max(0, max - 1)) + "…" : text;
}

export default async function MessageEditedEmbed(client: Client, old_message: SQLMessage, new_message: Message) {
    const before = truncate(old_message.content ?? "", 1500);
    const after = truncate(new_message.content ?? "", 1500);

    const embed = new EmbedBuilder()
        .setColor("#ffab33")
        .setTimestamp(new_message.editedAt ?? new Date())
        .setAuthor({ name: new_message.author.username, iconURL: new_message.author.displayAvatarURL() })
        .setDescription(
            `**Message sent by** <@${new_message.author.id}> **Edited in** <#${new_message.channelId}> ` +
                `[Jump to message](https://discord.com/channels/${new_message.guildId}/${old_message.channel_id}/${old_message.message_id}/)\n\n` +
                `**Before**\n${before}\n\n**After**\n${after}`
        )
        .setFooter({ text: "Author ID: " + new_message.author.id + " | Message ID: " + new_message.id });

    return embed;
}
