import { SlashCommandBuilder, CommandInteraction, PermissionFlagsBits, GuildMember } from "discord.js";
import { RegisterCommand } from "../../../data/Registry";
import { AddModMail, AddModnote } from "../../../database/database";
import { LogModMail, LogModnote } from "../../../services/logs";

export async function hb_init() {
    RegisterCommand(command, execute);
}

export const command = new SlashCommandBuilder()
    .setName("message")
    .setDescription("Message a server user from the bot. This will only be visible to server moderators.")
    .addUserOption((option) => option.setName("user").setDescription("User to message").setRequired(true))
    .addStringOption((option) =>
        option
            .setName("content")
            .setDescription("Message content. This will be sent to the user.")
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
    const dm = await target.createDM().catch(error => {
        console.log(error);
        return null;
    });

    if (!dm) {
        return interaction.editReply({ content: `Failed to send message to <@${target.id}>.` });
    }

    await dm.send(
        `## A message from the moderators
        ${content}

        Sent on behalf of the moderators by <@${issuer.user.id}>`.replace(/  +/g, "")
    );

    const newcontent = `Mod Message Sent: ${content}`;

    const modnote = await AddModMail(guild.id, target.id, issuer.id, newcontent, false);
    await LogModMail(interaction.guild, modnote);

    await interaction.editReply({ content: `Message sent to <@${target.id}>.` });

    
}
