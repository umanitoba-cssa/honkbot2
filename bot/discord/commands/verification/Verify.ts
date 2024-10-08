import { SlashCommandBuilder, CommandInteraction, TextChannel, ButtonBuilder, ButtonStyle, ActionRowBuilder, ButtonInteraction } from "discord.js";
import { RegisterButtonHandler, RegisterCommand } from "../../../data/Registry";
import { GetGuildSettings, GetPendingVerification } from "../../../database/database";
import { VerifyStudentModal } from "../../modals/verification/VerifyStudentModal";
import { Events } from "../../../data/Events";
import { TryVerifyUser } from "../../../services/verify";

export async function hb_init() {
    RegisterCommand(command, execute);
}

const command = new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Complete account verification.')
    .addStringOption(option => option.setName('code').setDescription('Verification code sent to your email').setRequired(true));

async function execute(interaction: CommandInteraction) {
    if (!interaction.guild) {
        await interaction.editReply({ content: 'This command must be used in a server.' });
        return;
    }

    await interaction.deferReply({ ephemeral: true });

    const code = interaction.options.get('code')?.value as string | null;

    if (!code) {
        await interaction.editReply({ content: 'Verification code is incorrect or has expired.' });
        return;
    }

    const request = await GetPendingVerification(code);

    if (!request || request.user_id !== interaction.user.id || request.guild_id !== interaction.guild.id) {
        await interaction.editReply({ content: 'Verification code is incorrect or has expired' });
        return;
    }

    await TryVerifyUser(interaction, request);
}