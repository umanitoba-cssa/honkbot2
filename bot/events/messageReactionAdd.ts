import { SQLGetUserMessage, SQLLogUserGiveReaction, SQLLogUserGiveThisTBHReaction, SQLLogUserRecieveReaction, SQLLogUserRecieveThisTBHReaction } from "../database/message_database";
import { Events, MessageReaction, GuildMember } from "discord.js";
import type { SQLMessage } from "../models/SQLMessage";

export const name: Events = Events.MessageReactionAdd;

export const execute = async (reaction: MessageReaction, user: GuildMember) => {
    if (!user.user.bot) {
    const message = await SQLGetUserMessage(reaction.message.guildId, reaction.message.channelId, reaction.message.id) as SQLMessage | null;

    if (message === null) {
        console.log("Message not found in the database.");
        return;
    }

    if (reaction.emoji.id === "1336040880112664597") {
        await SQLLogUserGiveThisTBHReaction(reaction.message.guildId, user.id);
        await SQLLogUserRecieveThisTBHReaction(reaction.message.guildId, message.user_id);
    }

    await SQLLogUserGiveReaction(reaction.message.guildId, user.id);
    await SQLLogUserRecieveReaction(reaction.message.guildId, message.user_id);
}
};