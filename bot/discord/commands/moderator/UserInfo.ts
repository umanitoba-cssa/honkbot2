import { SlashCommandBuilder, CommandInteraction, PermissionFlagsBits, GuildMember } from "discord.js";
import { RegisterCommand } from "../../../data/Registry";
import UserInfoEmbed from "../../../templates/embeds/UserInfoEmbed";
import { GetVerifiedUser } from "../../../database/database";

export async function hb_init() {
    RegisterCommand(command, execute);
}

export const command = new SlashCommandBuilder()
    .setName("userinfo")
    .setDescription("View verified information for a user.")
    .addUserOption((option) => option.setName("user").setDescription("User to display").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

export async function execute(interaction: CommandInteraction) {
    if (!interaction.guild) {
        await interaction.reply({ content: "This command must be used in a server." });
        return;
    }

    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;
    const target = interaction.options.get("user")!.member as GuildMember;
    const userinfo = await GetVerifiedUser(guild.id, target.id);

    if (!userinfo) {
        await interaction.editReply({ content: `Information not found for <@${target.id}>, the user has not completed verification.` });
        return;
    }

    const embed = await UserInfoEmbed(guild.client, userinfo);

    if (!embed) {
        await interaction.editReply({ content: `User not found.` });
        return;
    }

    await interaction.editReply({ embeds: [embed] });
}
