import { Client, EmbedBuilder, Message } from "discord.js";
import type { SQLMessage } from "../../models/SQLMessage";
import { SQLGetUserMessage } from "../../database/message_database";

export default async function MessageEditedEmbed(client: Client, old_message: SQLMessage, new_message: Message) {
        
    const embed = new EmbedBuilder()
        .setColor("#ffab33")
        .setTimestamp(new_message.editedTimestamp)
        .setAuthor({name: new_message.author.username, iconURL: new_message.author.displayAvatarURL() })
        .setDescription(`**Message sent by** <@${new_message.author.id}> **Edited in** <#${new_message.channelId}> [Jump to message](https://discord.com/channels/${new_message.guildId}/${old_message.channel_id}/${old_message.message_id}/)\n\n` + "**Before** \n" + old_message.content + "\n\n **After** \n" + new_message.content)
        .setFooter({text: "Author ID: " + new_message.author.id + " | Message ID: " + new_message.id});

    return embed;
}

