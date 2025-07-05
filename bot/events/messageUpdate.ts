import { Message, Events } from "discord.js";
import { SQLLogUserMessageEdit, SQLLogUserOriginalMessageEdit, SQLGetUserMessage } from "../database/message_database";
import { SendModLogEmbed } from "../services/logs";
import MessageEditedEmbed from "../templates/embeds/MessageEditedEmbed";

export const name: Events = Events.MessageUpdate;

export const execute = async (oldMessage: Message, newMessage: Message) => {
    if (!newMessage.author.bot) {
    if (newMessage.author.bot || newMessage === null) {
        return;
    }

    if (newMessage.guild) {
        const sql_message = await SQLGetUserMessage(newMessage.guildId, newMessage.channelId, newMessage.id);
        if (sql_message !== null) {
        SendModLogEmbed(newMessage.guild, await MessageEditedEmbed(newMessage.client, sql_message, newMessage));
        }
       }
    }

    if (oldMessage.content !== newMessage.content) {
        if (newMessage.editedTimestamp === null) {
            newMessage.editedTimestamp = Date.now();
        }


    SQLLogUserOriginalMessageEdit(newMessage.guildId, newMessage.channelId, newMessage.id, newMessage.author.id, oldMessage.content, newMessage.content, oldMessage.createdTimestamp);
    SQLLogUserMessageEdit(newMessage.guildId, newMessage.channelId, newMessage.id, newMessage.author.id, newMessage.content, newMessage.editedTimestamp);
}
};

