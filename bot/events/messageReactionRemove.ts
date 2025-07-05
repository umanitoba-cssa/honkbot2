import { Message, Events, MessageReaction, GuildMember } from "discord.js";
import { SQLGetUserMessage, SQLLogUserRemoveGiveReaction, SQLLogUserRemoveGiveThisTBHReaction, SQLLogUserRemoveRecieveReaction, SQLLogUserRemoveRecieveThisTBHReaction } from "../database/message_database";

export const name: Events = Events.MessageReactionRemove;

export const execute = async (reaction: MessageReaction, user: GuildMember) => {
    if (!user.user.bot) {

    const message = await SQLGetUserMessage(reaction.message.guildId, reaction.message.channelId, reaction.message.id);    

   if (reaction.emoji.id === "1336040880112664597") {
    SQLLogUserRemoveGiveThisTBHReaction(reaction.message.guildId, user.id);
    if (message !== null) {
        SQLLogUserRemoveRecieveThisTBHReaction(reaction.message.guildId, String(message.user_id));
    }
   }

   SQLLogUserRemoveGiveReaction(reaction.message.guildId, user.id);
   if (message !== null) {
   SQLLogUserRemoveRecieveReaction(reaction.message.guildId, String(message.user_id));
   }
}
};