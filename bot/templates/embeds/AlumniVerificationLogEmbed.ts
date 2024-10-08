import { Client, EmbedBuilder } from "discord.js";
import type { PendingVerification } from "../../models/VerifiedUser";

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
        .setColor("#00ff00")
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

    return embed;
}