import { SlashCommandBuilder, CommandInteraction, PermissionFlagsBits, GuildMember } from "discord.js";
import { RegisterCommand } from "../../../data/Registry";
import { AddUserBan } from "../../../database/database";
import { LogBan } from "../../../services/logs";

export async function hb_init() {
    RegisterCommand(command, execute);
}

export const command = new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban a user for a rule violation.")
    .addUserOption((option) => option.setName("user").setDescription("User to ban").setRequired(true))
    .addStringOption((option) =>
        option
            .setName("reason")
            .setDescription("Reason for ban. This will be displayed to the user.")
            .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

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
    const dm = await target.createDM();

    const ban = await AddUserBan(guild.id, target.id, issuer.id, reason, false);
    await LogBan(interaction, ban);
    target.ban({ reason: reason });
    let message = `
            ## Ban Issued
            You have been banned from the **${guild.name}** server for the following reason:

            > ${reason}

            If you believe this ban has been issued in error, please contact a server moderator.
        `;
    await dm.send(message.replace(/  +/g, ""));

    await interaction.editReply({ content: `Ban issued to <@${target.id}>.` });
}
