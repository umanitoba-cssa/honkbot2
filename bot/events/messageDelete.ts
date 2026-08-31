import { Message, Events } from "discord.js";
import { SQLLogUserMessageDelete, SQLLogUserMessageEdit } from "../database/message_database";
import { SendModLogEmbed } from "../services/logs";
import MessageDeletedEmbed from "../templates/embeds/MessageDeletedEmbed";

export const name: Events = Events.MessageDelete;

export const execute = async (message: Message) => {

   // const value = await SQLLogUserMessageDelete(message.guildId, message.channelId, message.id);

   // if (value !== null && value !== undefined && message.guild) {
   //  SendModLogEmbed(message.guild, await MessageDeletedEmbed(message.client, message));
   // }
};