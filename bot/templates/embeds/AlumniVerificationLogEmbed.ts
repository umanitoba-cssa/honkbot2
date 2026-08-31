import { Client, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ButtonInteraction, PermissionFlagsBits, Message } from "discord.js";
import type { PendingVerification } from "../../models/VerifiedUser";
import { Events } from "../../data/Events";
import { RegisterButtonHandler } from "../../data/Registry";
import { GetPendingVerification } from "../../database/database";
import { TryVerifyUserAsMod } from "../../services/verify";

export async function hb_init() {
    RegisterButtonHandler(Events.Button.ForceVerifyPending, handleForceVerifyPending);
}

async function handleForceVerifyPending(interaction: ButtonInteraction) {
    try {
        console.log("ForceVerify button pressed:", interaction.customId);

        if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages)) {
            await interaction.reply({ content: 'You do not have permission to force verify users.', ephemeral: true });
            return;
        }

        const customId = interaction.customId;
        const pendingId = customId.split(':')[1];

        if (!pendingId) {
            await interaction.reply({ content: 'Invalid verification ID.', ephemeral: true });
            console.error("Invalid verification ID in button:", customId);
            return;
        }

        await interaction.deferReply({ ephemeral: true });

        const request = await GetPendingVerification(pendingId);

        if (request) {
            await (interaction.message as Message).edit({ components: [] })
        }

        if (!request) {
            await interaction.editReply({ content: 'Verification record not found. It may have already been processed or expired.' });
            // console.error("Verification request not found for ID:", pendingId);
            return;
        }

        if (!interaction.guild || request.guild_id !== interaction.guild.id) {
            await interaction.editReply({ content: 'Verification code is incorrect or has expired' });
            // console.error("Verification request not found or guild mismatch:", { pendingId, guildId: interaction.guild?.id });
            return;
        }

        await TryVerifyUserAsMod(interaction, request);
    } catch (err) {
        console.error("Error in handleForceVerifyPending:", err);
        if (interaction.deferred || interaction.replied) {
            await interaction.editReply({ content: 'An error occurred during verification.' });
        } else {
            await interaction.reply({ content: 'An error occurred during verification.', ephemeral: true });
        }
    }
}

export default async function AlumniVerificationLogEmbed(client: Client, pending: PendingVerification) {
    const guild = client.guilds.cache.get(pending.guild_id);

    if (!guild) {
        return;
    }

    const member = guild.members.cache.get(pending.user_id);

    if (!member) {
        return;
    }

    const embed = new EmbedBuilder()
        .setColor("#FF33E9")
        .setTitle("Alumni Pending Verification")
        .addFields(
            { name: "Name", value: pending.name, inline: true },
            { name: "Handle", value: `<@${member.id}>`, inline: true },
            { name: "Type", value: pending.type, inline: true }
        )
        .addFields({ name: "Email", value: pending.email, inline: true });

    switch (pending.type) {
        case "alumni":
            embed.addFields(
                { name: "Grad Year", value: pending.alumni_year_graduated.toString(), inline: true },
                { name: "Verification Code", value: pending.id, inline: true }
            );
            break;
    }

    const forceVerifyButton = new ButtonBuilder()
        .setCustomId(`${Events.Button.ForceVerifyPending}:${pending.id}`)
        .setLabel('Verify Alumni')
        .setStyle(ButtonStyle.Success);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(forceVerifyButton);

    return {
        embeds: [embed],
        components: [row]
    };
}
