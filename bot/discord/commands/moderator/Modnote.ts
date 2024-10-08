import { SlashCommandBuilder, CommandInteraction, PermissionFlagsBits, GuildMember } from "discord.js";
import { RegisterCommand } from "../../../data/Registry";
import { AddModnote } from "../../../database/database";
import { LogModnote } from "../../../services/logs";

export async function hb_init() {
    RegisterCommand(command, execute);
}

export const command = new SlashCommandBuilder()
    .setName("modnote")
    .setDescription("Record a note for a certain user. This will only be visible to server moderators.")
    .addUserOption((option) => option.setName("user").setDescription("User to add note to").setRequired(true))
    .addStringOption((option) =>
        option
            .setName("content")
            .setDescription("Note content. This will only be visible to server moderators.")
            .setRequired(true)
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
    const content = interaction.options.get("content")!.value as string;

    const modnote = await AddModnote(guild.id, target.id, issuer.id, content);
    LogModnote(interaction, modnote);

    await interaction.editReply({ content: `Modnote recorded for <@${target.id}>.` });
}
