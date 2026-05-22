import { SlashCommandBuilder, CommandInteraction, PermissionFlagsBits, GuildMember } from "discord.js";
import { RegisterCommand } from "../../../data/Registry";
import { AddUserTimeout } from "../../../database/database";
import { LogTimeout } from "../../../services/logs";

export async function hb_init() {
    RegisterCommand(command, execute);
}

export const command = new SlashCommandBuilder()
    .setName("timeout")
    .setDescription("Timeouts's a user for a rule violation.")
    .addUserOption((option) => option.setName("user").setDescription("User to timeout").setRequired(true))
    .addIntegerOption((option) => option.setName("duration").setDescription("Duration of the timeout in minutes.").setRequired(true))
    .addStringOption((option) =>
        option
            .setName("reason")
            .setDescription("Reason for timeout. This will be displayed to the user.")
            .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers);

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
    const duration = interaction.options.get("duration")!.value as number;
    const durationMilliseconds = duration * 1000 * 60;
    const dm = await target.createDM();

    const ban = await AddUserTimeout(guild.id, target.id, issuer.id, duration, reason, false);
    await LogTimeout(interaction, ban);
    target.timeout(durationMilliseconds, reason);
    let message = `
            ## Timeout Issued
            You have been timeouted from the **${guild.name}** server for the following reason:

            > ${reason}

            You have been timedout for <t:${Date.now() + durationMilliseconds}> minutes.

            If you believe this timeout has been issued in error, please contact a server moderator.
        `;
    await dm.send(message.replace(/  +/g, ""));

    await interaction.editReply({ content: `Kick issued to <@${target.id}>.` });
}
