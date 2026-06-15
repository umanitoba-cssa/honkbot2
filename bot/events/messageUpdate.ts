import { Message, Events, type PartialMessage } from "discord.js";
import { SQLLogUserMessageEdit, SQLLogUserOriginalMessageEdit, SQLGetUserMessage } from "../database/message_database";
import { SendModLogEmbed } from "../services/logs";
import MessageEditedEmbed from "../templates/embeds/MessageEditedEmbed";

export const name: Events = Events.MessageUpdate;

export const execute = async (oldMessage: Message | PartialMessage, newMessage: Message | PartialMessage) => {
    const resolvedOldMessage = oldMessage.partial ? await oldMessage.fetch().catch(() => null) : oldMessage;
    const resolvedNewMessage = newMessage.partial ? await newMessage.fetch().catch(() => null) : newMessage;
    if (!resolvedOldMessage || !resolvedNewMessage) {
        return;
    }

    if (!resolvedNewMessage.author.bot && resolvedNewMessage.guildId) {
        if (oldMessage.content !== newMessage.content) {
            if (resolvedNewMessage.guild) {
                const sql_message = await SQLGetUserMessage(resolvedNewMessage.guildId, resolvedNewMessage.channelId, resolvedNewMessage.id);
                if (sql_message !== null) {
                    SendModLogEmbed(resolvedNewMessage.guild, await MessageEditedEmbed(resolvedNewMessage.client, sql_message, resolvedNewMessage))
                }
            }
            
            const editedTimestamp = resolvedNewMessage.editedTimestamp ?? Date.now()

            SQLLogUserOriginalMessageEdit(resolvedNewMessage.guildId, resolvedNewMessage.channelId, resolvedNewMessage.id, resolvedNewMessage.author.id, resolvedOldMessage.content, resolvedNewMessage.content, resolvedOldMessage.createdTimestamp);
            SQLLogUserMessageEdit(resolvedNewMessage.guildId, resolvedNewMessage.channelId, resolvedNewMessage.id, resolvedNewMessage.author.id, resolvedNewMessage.content, editedTimestamp);
        }
    }
};

