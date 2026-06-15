import { Message, Events, MessageReaction, User } from "discord.js";
import type { PartialUser } from "discord.js";
import { SQLGetUserMessage, SQLLogUserRemoveGiveReaction, SQLLogUserRemoveGiveThisTBHReaction, SQLLogUserRemoveRecieveReaction, SQLLogUserRemoveRecieveThisTBHReaction } from "../database/message_database";

export const name: Events = Events.MessageReactionRemove;

export const execute = async (reaction: MessageReaction, user: User | PartialUser) => {
    // Only process reactions in guild messages, not DMs, and not from bots
    if (!user.bot && reaction.message.guildId) {
        const message = await SQLGetUserMessage(reaction.message.guildId, reaction.message.channelId, reaction.message.id);    

        if (reaction.emoji.id === "1336040880112664597") {
            await SQLLogUserRemoveGiveThisTBHReaction(reaction.message.guildId, user.id);
            if (message !== null) {
                await SQLLogUserRemoveRecieveThisTBHReaction(reaction.message.guildId, String(message.user_id));
            }
        }

        await SQLLogUserRemoveGiveReaction(reaction.message.guildId, user.id);
        if (message !== null) {
            await SQLLogUserRemoveRecieveReaction(reaction.message.guildId, String(message.user_id));
        }
    }
};