import { Client, Message, EmbedBuilder, ChannelType, Events, GuildMember, User } from "discord.js";
import { AddModMail, GetGuildSettings } from "../database/database";
import { LogModMail } from "../services/logs";

export const name: Events = Events.MessageCreate;

export const execute = async (message: Message) => {
    if (message.author.bot) {
        return;
    }
    
    if (message.channel.type === ChannelType.DM) {
        forwardDM(message.content, message.client as Client, message.author);
        console.log('DM received');
    }
}

export async function forwardDM(message: string, client: Client, user: User) {
        const guildId = process.env.DISCORD_GUILD_ID;
        
        if (!guildId) {
            console.log("DISCORD_GUILD_ID is not defined.");
            return;
        }
        
        const guild = client.guilds.cache.get(guildId);

        if (!guild) {
            console.log("no guild");
            return;
        }

        const guildSettings = await GetGuildSettings(guild.id);

        if (!guildSettings) {
            return;
        }

        const modmailChannel = guild.channels.cache.get(guildSettings.modlog_channel_id);

        if (!modmailChannel || !modmailChannel.isTextBased()) {
            return;
        }

        const mod_mail = await AddModMail(guildId, "0", user.id, message, true);
        await LogModMail(guild, mod_mail);
}