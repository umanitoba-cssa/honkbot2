import { SlashCommandBuilder, CommandInteraction, PermissionFlagsBits, GuildMember } from "discord.js";
import { RegisterCommand } from "../../../data/Registry";
import { AddUserKick } from "../../../database/database";
import { LogKick } from "../../../services/logs";

export async function hb_init() {
    RegisterCommand(command, execute);
}

export const command = new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kick's a user for a rule violation.")
    .addUserOption((option) => option.setName("user").setDescription("User to kick").setRequired(true))
    .addStringOption((option) =>
        option
            .setName("reason")
            .setDescription("Reason for kick. This will be displayed to the user.")
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
    const dm = await target.createDM().catch(error => {
        console.log(error);
        return null;
    });

    if (!dm) {
        console.error(`Failed to send message to <@${target.id}>.`);
    }

    const ban = await AddUserKick(guild.id, target.id, issuer.id, reason, false);
    await LogKick(interaction, ban);
    target.kick(reason);
    let message = `
            ## Kick Issued
            You have been kicked from the **${guild.name}** server for the following reason:

            > ${reason}

            If you believe this kick has been issued in error, please contact a server moderator.
        `;
    if (dm) {
        await dm.send(message.replace(/  +/g, ""));
    }

    await interaction.editReply({ content: `Kick issued to <@${target.id}>.` });
}
