import { Events, MessageReaction, User } from "discord.js";
import type { PartialMessageReaction, PartialUser } from "discord.js";
import { SQLGetUserMessage, SQLLogUserRemoveGiveReaction, SQLLogUserRemoveGiveThisTBHReaction, SQLLogUserRemoveRecieveReaction, SQLLogUserRemoveRecieveThisTBHReaction } from "../database/message_database";

export const name: Events = Events.MessageReactionRemove;

export const execute = async (reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) => {
    const resolvedReaction = reaction.partial ? await reaction.fetch().catch(() => null) : reaction;

    if (!resolvedReaction) return;

    if (!user.bot && resolvedReaction.message.guildId) {
        try {
            const message = await SQLGetUserMessage(resolvedReaction.message.guildId, resolvedReaction.message.channelId, resolvedReaction.message.id);

            if (message === null) {
                return;
            }

            if (resolvedReaction.emoji.id === "1336040880112664597") {
                await SQLLogUserRemoveGiveThisTBHReaction(resolvedReaction.message.guildId, user.id);
                await SQLLogUserRemoveRecieveThisTBHReaction(resolvedReaction.message.guildId, String(message.user_id));
            } else {
                await SQLLogUserRemoveGiveReaction(resolvedReaction.message.guildId, user.id);
                await SQLLogUserRemoveRecieveReaction(resolvedReaction.message.guildId, String(message.user_id));
            }
        } catch (err) {
            console.error("Failed to log reaction remove:", err);
        }
    }
};
