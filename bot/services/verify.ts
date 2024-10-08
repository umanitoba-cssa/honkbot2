import { type CommandInteraction, type GuildMember, type Role } from "discord.js";
import type { PendingVerification } from "../models/VerifiedUser";
import { GetGuildSettings, VerifyUserDB, VerifyAlumniUserDB, VerifyAlumniUserAsModDB } from "../database/database";
import { LogVerification, LogPendingVerification } from "./logs";

export async function TryVerifyUserAsMod(interaction: CommandInteraction, pending: PendingVerification) {
    const guildSettings = await GetGuildSettings(pending.guild_id);

    if (!guildSettings || !guildSettings.verified_role_id || !guildSettings.verified_role_id) {
        await interaction.editReply({
            content: "This server has not been set up for verification."
        });
        return;
    }

    const guild = interaction.guild;
    let member: GuildMember | null = null;
    try {
        if (guild != null) {
        member = await guild.members.fetch(pending.user_id);
        }
    } catch (error) {
        console.error("Error fetching guild member:", error);
        await interaction.editReply({ content: "Failed to fetch the guild member." });
        return;
    }
    const verifiedRole = guild?.roles.cache.get(guildSettings?.verified_role_id);
    const memberTypeRole = ((): Role | undefined => {
        switch (pending.type) {
            case "student":
                return guild?.roles.cache.get(guildSettings.student_role_id);
            case "alumni":
                return guild?.roles.cache.get(guildSettings.alumni_role_id);
            case "instructor":
                return undefined;
            case "guest":
                return undefined;
        }
    })();

    if (memberTypeRole == undefined) {
        await interaction.editReply({ content: "You are not allowed to verify this user." });
        return;
    }

    if (!member) {
        await interaction.editReply({ content: "You must be in the server to verify." });
        return;
    }

    try {
        if (pending.type == "student") {
            await VerifyUserDB(pending);

            if (verifiedRole) {
                await member.roles.add([verifiedRole]);
            }

            if (memberTypeRole) {
                await member.roles.add([memberTypeRole]);
            }

            if (member.roles.cache.has(guildSettings.preverified_role_id)) {
                await member.roles.remove([guildSettings.preverified_role_id]);
            }

            // if (guildSettings.welcome_channel_id) {
            //     const welcomeChannel = guild?.channels.cache.get(guildSettings.welcome_channel_id);
            //     if (welcomeChannel?.isTextBased()) {
            //         welcomeChannel.send(`Welcome to the server, <@${member.id}>!`);
            //     }
            // }

            LogVerification(interaction, pending);

           await interaction.editReply({ content: "User has been verified!" });
        }else if (pending.type == "alumni") {
            await VerifyAlumniUserAsModDB(pending);

            if (verifiedRole) {
                await member.roles.add([verifiedRole]);
                await member.roles.remove([guildSettings.preverified_role_id]);
            }

            if (memberTypeRole) {
                await member.roles.add([memberTypeRole]);
            }

            // if (guildSettings.welcome_channel_id) {
            //     const welcomeChannel = guild?.channels.cache.get(guildSettings.welcome_channel_id);
            //     if (welcomeChannel?.isTextBased()) {
            //         welcomeChannel.send(`Welcome to the server, <@${member.id}>!`);
            //     }
            // }

            LogVerification(interaction, pending);

            interaction.editReply({ content: "The user has been verified!" });
        } else {
            interaction.editReply({
                content:
                    "Unsure of how you got to this, maybe you should report this to the bot admin"
            });
        }
    } catch (err) {
        interaction.editReply({
            content: "An error occurred while verifying you. Please try again later."
        });
        console.error(err);
    }
}


export async function TryVerifyUser(interaction: CommandInteraction, pending: PendingVerification) {
    const guildSettings = await GetGuildSettings(pending.guild_id);

    if (!guildSettings || !guildSettings.verified_role_id || !guildSettings.verified_role_id) {
        await interaction.editReply({
            content: "This server has not been set up for verification."
        });
        return;
    }

    const guild = interaction.guild;
    const member = interaction.member as GuildMember | null;
    const verifiedRole = guild?.roles.cache.get(guildSettings?.verified_role_id);
    const memberTypeRole = ((): Role | undefined => {
        switch (pending.type) {
            case "student":
                return guild?.roles.cache.get(guildSettings.student_role_id);
            case "alumni":
                return guild?.roles.cache.get(guildSettings.alumni_role_id);
            case "instructor":
                return guild?.roles.cache.get(guildSettings.instructor_role_id);
            case "guest":
                return guild?.roles.cache.get(guildSettings.guest_role_id);
        }
    })();

    if (!member) {
        await interaction.editReply({ content: "You must be in the server to verify." });
        return;
    }

    

    try {
        if (pending.type == "student") {
            await VerifyUserDB(pending);

            if (verifiedRole) {
                await member.roles.add([verifiedRole]);
            }

            if (memberTypeRole) {
                await member.roles.add([memberTypeRole]);
            }

            if (member.roles.cache.has(guildSettings.preverified_role_id)) {
                await member.roles.remove([guildSettings.preverified_role_id]);
            }

            // if (guildSettings.welcome_channel_id) {
            //     const welcomeChannel = guild?.channels.cache.get(guildSettings.welcome_channel_id);
            //     if (welcomeChannel?.isTextBased()) {
            //         welcomeChannel.send(`Welcome to the server, <@${member.id}>!`);
            //     }
            // }

            LogVerification(interaction, pending);

           await interaction.editReply({ content: "You have been verified!" });
        } else if (pending.type == "alumni") {
            await VerifyAlumniUserDB(pending);
            LogPendingVerification(interaction, pending);

            await interaction.editReply({ content: "You're email address has been verified. You will be fully verified once the moderators have the chance. If you haven't been contacted or verified after a few days DM the bot to reach out to us." });
        } else {
            interaction.editReply({
                content:
                    "Your email has been verified. Alumni and instructor verifications are reviewed manually by server moderators, and you will receive a ping when your verification has been approved."
            });
        }
    } catch (err) {
        interaction.editReply({
            content: "An error occurred while verifying you. Please try again later."
        });
        console.error(err);
    }
}
