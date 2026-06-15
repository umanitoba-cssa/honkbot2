import { Client, EmbedBuilder, Message } from "discord.js";
import type { SQLMessage } from "../../models/SQLMessage";
import { SQLGetUserMessage } from "../../database/message_database";

function truncate(text: string, max: number) {
    return text.length > max ? text.slice(0, Math.max(0, max - 1)) + "…" : text;
}

export default async function MessageDeletedEmbed(client: Client, message: Message) {
    const sql_message = (await SQLGetUserMessage(message.guildId, message.channelId, message.id)) as SQLMessage | null;

    if (sql_message === null) {
        return;
    }

    const content = truncate(sql_message.content ?? "", 3500);

    const embed = new EmbedBuilder()
        .setColor("#fc1703")
        .setTimestamp(Date.now())
        .setAuthor({ name: message.author.username, iconURL: message.author.displayAvatarURL() })
        .setDescription(`**Message sent by** <@${message.author.id}> **Deleted in** <#${message.channelId}>\n${content}`)
        .setFooter({ text: "Author ID: " + sql_message.user_id + " | Message ID: " + sql_message.message_id });

    return embed;
}
