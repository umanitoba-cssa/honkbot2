import { SQLGetUserMessage, SQLLogUserGiveReaction, SQLLogUserGiveThisTBHReaction, SQLLogUserRecieveReaction, SQLLogUserRecieveThisTBHReaction } from "../database/message_database";
import { Events, MessageReaction, User, type PartialMessageReaction } from "discord.js";
import type { PartialUser } from "discord.js";
import type { SQLMessage } from "../models/SQLMessage";

export const name: Events = Events.MessageReactionAdd;

export const execute = async (reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) => {
    const resolvedReaction = reaction.partial ? await reaction.fetch().catch(() => null) : reaction;
    if (!resolvedReaction) return;

    // Only process reactions in guild messages, not DMs, and not from bots
    if (!user.bot && resolvedReaction.message.guildId) {
        const message = await SQLGetUserMessage(resolvedReaction.message.guildId, resolvedReaction.message.channelId, resolvedReaction.message.id) as SQLMessage | null;

        if (message === null) {
            console.log("Message not found in the database.");
            return;
        }

        if (resolvedReaction.emoji.id === "1336040880112664597") {
            await SQLLogUserGiveThisTBHReaction(resolvedReaction.message.guildId, user.id);
            await SQLLogUserRecieveThisTBHReaction(resolvedReaction.message.guildId, message.user_id);
        }

        await SQLLogUserGiveReaction(resolvedReaction.message.guildId, user.id);
        await SQLLogUserRecieveReaction(resolvedReaction.message.guildId, message.user_id);
    }
};