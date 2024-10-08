import { SlashCommandBuilder, CommandInteraction, PermissionFlagsBits, TextChannel, ButtonBuilder, ButtonStyle, ActionRowBuilder, ButtonInteraction } from "discord.js";
import { RegisterButtonHandler, RegisterCommand } from "../../../data/Registry";
import { GetGuildSettings } from "../../../database/database";
import { VerifyStudentModal } from "../../modals/verification/VerifyStudentModal";
import { Events } from "../../../data/Events";
import { VerifyAlumniModal } from "../../modals/verification/VerifyAlumniModal";

export async function hb_init() {
    RegisterCommand(command, execute);
    RegisterButtonHandler(Events.Button.VerifyStudent, handleVerifyStudent);
    RegisterButtonHandler(Events.Button.VerifyAlumni, handleVerifyAlumni);
    RegisterButtonHandler(Events.Button.VerifyInstructor, handleVerifyInstructor);
}

const command = new SlashCommandBuilder()
    .setName('populate-verification-channel')
    .setDescription('Add verification buttons to `verification_info_channel_id`')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels);

async function execute(interaction: CommandInteraction) {
    if (!interaction.guildId) {
        await interaction.reply({ content: 'This command must be run in a server', ephemeral: true });
        return;
    }

    await interaction.deferReply({ephemeral: true});

    const guild_id = interaction.guildId;
    const guild_settings = await GetGuildSettings(guild_id)
    
    const verification_channel_id = guild_settings?.verification_info_channel_id ?? null;

    if (!verification_channel_id) {
        await interaction.followUp({ content: 'No verification channel set', ephemeral: true });
        return;
    }

    const verification_channel = await interaction.guild?.channels.fetch(verification_channel_id) as TextChannel;
    if (!verification_channel) {
        await interaction.followUp({ content: 'Verification info channel not found', ephemeral: true });
        return;
    }

    const btnStudent = new ButtonBuilder()
        .setCustomId(Events.Button.VerifyStudent)
        .setLabel('I am currently a Student')
        .setStyle(ButtonStyle.Success);

    const btnAlumni = new ButtonBuilder()
        .setCustomId(Events.Button.VerifyAlumni)
        .setLabel('I am an Alumni')
        .setStyle(ButtonStyle.Primary);

    const btnInstructor = new ButtonBuilder()
        .setCustomId(Events.Button.VerifyInstructor)
        .setLabel('I am an Instructor')
        .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        btnStudent,
        btnAlumni,
        btnInstructor
    );
    
    verification_channel.send({
        content: 'To gain full access to this server, you must verify your status at the University of Manitoba. ' 
                + 'This helps us create a safe space for our community and keep all students accountable.'
                + '\n\nPlease choose the option below which best describes you:',
        components: [row]
    })

    await interaction.followUp({ content: 'Verification buttons added to verification channel', ephemeral: true });
}

async function handleVerifyStudent(interaction: ButtonInteraction) {
    await VerifyStudentModal.show(interaction);
}

async function handleVerifyAlumni(interaction: ButtonInteraction) {
    //await interaction.reply({ content: 'Alumni verification is not yet available. DM the bot to connect with the moderators for more information.', ephemeral: true });
    await VerifyAlumniModal.show(interaction);
}

async function handleVerifyInstructor(interaction: ButtonInteraction) {
    await interaction.reply({ content: 'Instructor verification is not yet available. DM the bot to connect with the moderators for more information.', ephemeral: true });
}