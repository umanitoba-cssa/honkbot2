import { SlashCommandBuilder, CommandInteraction, TextChannel, ButtonBuilder, ButtonStyle, ActionRowBuilder, ButtonInteraction, PermissionFlagsBits } from "discord.js";
import { RegisterButtonHandler, RegisterCommand } from "../../../data/Registry";
import { GetGuildSettings, GetPendingAlumniVerification, GetPendingVerification } from "../../../database/database";
import { VerifyStudentModal } from "../../modals/verification/VerifyStudentModal";
import { Events } from "../../../data/Events";
import { TryVerifyUserAsMod } from "../../../services/verify";

export async function hb_init() {
    RegisterCommand(command, execute);
}

const command = new SlashCommandBuilder()
    .setName('forceverify')
    .setDescription('Complete account verification for users as a moderator.')
    .addStringOption(option => option.setName('code').setDescription('Verification ID of user').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

async function execute(interaction: CommandInteraction) {
    if (!interaction.guild) {
        await interaction.editReply({ content: 'This command must be used in a server.' });
        return;
    }

    interaction.deferReply({ ephemeral: true });

    const code = interaction.options.get('code')?.value as string | null;

    if (!code) {
        await interaction.editReply({ content: 'Verification code is incorrect or has expired.' });
        return;
    }

    const request = await GetPendingVerification(code);

    if (!request || request.guild_id !== interaction.guild.id) {
        await interaction.editReply({ content: 'Verification code is incorrect or has expired' });
        return;
    }

    await TryVerifyUserAsMod(interaction, request);
}