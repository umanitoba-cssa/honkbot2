import { SlashCommandBuilder, CommandInteraction, PermissionFlagsBits, GuildMember } from "discord.js";
import { RegisterCommand } from "../../../data/Registry";
import { AddUserBan, AddUserWarning, GetGuildSettings, GetStrikeCount } from "../../../database/database";
import { LogBan, LogWarning } from "../../../services/logs";

export async function hb_init() {
    RegisterCommand(command, execute);
}

export const command = new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Warn a user for a rule violation.")
    .addUserOption((option) => option.setName("user").setDescription("User to warn").setRequired(true))
    .addStringOption((option) =>
        option
            .setName("reason")
            .setDescription("Reason for warning. This will be displayed to the user.")
            .setRequired(true)
    )
    .addBooleanOption((option) =>
        option.setName("strike").setDescription("Record this warning as a formal strike").setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

export async function execute(interaction: CommandInteraction) {
    if (!interaction.guild) {
        await interaction.reply({ content: "This command must be used in a server." });
        return;
    }

    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;
    const issuer = interaction.member! as GuildMember;
    const target = interaction.options.get("user")!.member as GuildMember;
    const reason = interaction.options.get("reason")!.value as string;
    const strike = interaction.options.get("strike")!.value as boolean;

    const warn = await AddUserWarning(interaction.guild.id, target.id, issuer.id, reason, strike);
    LogWarning(interaction, warn);

    if (strike) {
        const strikeCount = strike ? await GetStrikeCount(guild.id, target.id) : 0;
        const maxStrikes = strike ? (await GetGuildSettings(guild.id))?.max_strikes ?? 3 : 0;
        let message = `
            ## Warning Issued
            You have been issued a warning in the **${guild.name}** server for the following reason:

            > ${reason}

            This warning has been recorded as a formal strike. **You now have ${strikeCount}/${maxStrikes} strikes.**
        `;

        if (strikeCount < maxStrikes) {
            message += `\n*We encourage you to review the server rules to avoid future warnings as 3 strikes will result in a permanent ban. If you believe this warning was issued in error, please contact a server moderator.*`;
        }

        const dm = await target.createDM();
        await dm.send(message.replace(/  +/g, ""));


        // if (strikeCount >= maxStrikes) {
        //     const ban = await AddUserBan(
        //         guild.id,
        //         target.id,
        //         issuer.id,
        //         `Reached maximum number of strikes (${maxStrikes})`,
        //         true
        //     );
        //     await LogBan(interaction, ban);
        //     target.ban({ reason: `Reached maximum number of strikes (${maxStrikes})` });
        //     await dm.send(
        //         `
        //         ## Strike Limit Reached
        //         You have reached the maximum number of strikes in the **${guild.name}** server. You have been banned from the server.
        //     `.replace(/  +/g, "")
        //     );

        //     await interaction.editReply({
        //         content: `Warning issued to <@${target.id}>. The user has accrued the maximum number of strikes and has been banned from the server.`
        //     });
        // } 
        if (strikeCount >= maxStrikes) {
            target.timeout(10080 * 60 * 1000, `Reached maximum number of strikes (${maxStrikes})`);
            await dm.send(
            `
            ## Strike Limit Reached
            You have reached the maximum number of strikes in the **${guild.name}** server. You have been timed out from the server. The moderators will discuss your record and get back to you soon.
        `.replace(/  +/g, "")
        );

        await interaction.editReply({
            content: `Warning issued to <@${target.id}>. The user has accrued the maximum number of strikes and has been timedout from the server.`
        });
    } else {
            await interaction.editReply({
                content: `Warning issued to <@${target.id}>. The user is now at ${strikeCount}/${maxStrikes} strikes.`
            });
        }
    } else {
        let message = `
            ## Warning Issued
            You have been issued a warning in the **${guild.name}** server for the following reason:

            > ${reason}

            This warning has not been recorded as a formal strike, however we encourage you to review the server rules to avoid future warnings as 3 strikes will result in a permanent ban.
        `;

        const dm = await target.createDM();
        await dm.send(message.replace(/  +/g, ""));

        await interaction.editReply({ content: `Warning issued to <@${target.id}> without a strike.` });
    }
}
