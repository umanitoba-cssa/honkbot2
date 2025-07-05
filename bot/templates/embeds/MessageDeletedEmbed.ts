import { Client, EmbedBuilder, Message } from "discord.js";
import type { SQLMessage } from "../../models/SQLMessage";
import { SQLGetUserMessage } from "../../database/message_database";

export default async function MessageDeletedEmbed(client: Client, message: Message) {

    const sql_message = await SQLGetUserMessage(message.guildId, message.channelId, message.id) as SQLMessage;

    if (sql_message !== null) {
        
    const embed = new EmbedBuilder()
        .setColor("#fc1703")
        .setTimestamp(Date.now())
        .setAuthor({name: message.author.username, iconURL: message.author.displayAvatarURL() })
        .setDescription(`**Message sent by** <@${message.author.id}> **Deleted in** <#${message.channelId}>\n` + sql_message.content)
        .setFooter({text: "Author ID: " + sql_message.user_id + " | Message ID: " + sql_message.message_id});

    return embed;
    }
}
