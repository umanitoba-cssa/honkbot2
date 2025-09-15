import { Message, Events } from "discord.js";
import { SQLLogUserMessage, SQLLogUserMessageCount } from "../database/message_database";

export const name: Events = Events.MessageCreate;

export const execute = async (message: Message) => {
    // Only log messages that are in a guild (not DMs) and not from bots
    if (!message.author.bot && message.guildId) {
        SQLLogUserMessage(message.guildId, message.channelId, message.id, message.author.id, message.content, message.createdTimestamp);
        SQLLogUserMessageCount(message.guildId, message.author.id);
    }
};