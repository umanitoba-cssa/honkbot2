import { Client, Message, EmbedBuilder, ChannelType, Events, GuildMember, User, Role } from "discord.js";
import { AddModMail, GetGuildSettings, GetVerifiedUser } from "../database/database";
import { LogReVerification } from "../services/logs";

export const name: Events = Events.GuildMemberAdd;

export const execute = async (member: GuildMember) => {
    try {
        const verifiedUser = await GetVerifiedUser(member.guild.id, member.id) || null;
        const guildSettings = await GetGuildSettings(member.guild.id);

        if (!guildSettings) {
            console.error(`Guild settings not found for guild ID: ${member.guild.id}`);
            return;
        }

        const guild = member.guild;
        const verifiedRole = guildSettings.verified_role_id;

        if (verifiedUser) {
            const memberTypeRole = ((): Role | undefined => {
                switch (verifiedUser.type) {
                    case "student":
                        return guild.roles.cache.get(guildSettings.student_role_id);
                    case "alumni":
                        return guild.roles.cache.get(guildSettings.alumni_role_id);
                    case "instructor":
                    case "guest":
                        return undefined;
                }
            })();

            if (verifiedRole) {
                await member.roles.add([verifiedRole]);
            }

            if (memberTypeRole) {
                await member.roles.add([memberTypeRole]);
            }

            if (member.roles.cache.has(guildSettings.preverified_role_id)) {
                await member.roles.remove([guildSettings.preverified_role_id]);
            }

            LogReVerification(guild, verifiedUser);
        }
    } catch (error) {
        console.error(`Error in GuildMemberAdd event: ${error}`);
    }
};