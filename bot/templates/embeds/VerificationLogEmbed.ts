import { Client, EmbedBuilder } from "discord.js";
import type { PendingVerification } from "../../models/VerifiedUser";

export default async function VerificationLogEmbed(client: Client, pending: PendingVerification) {
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
        .setTitle("User Verified")
        .addFields(
            { name: "Name", value: pending.name, inline: true },
            { name: "Handle", value: `<@${member.id}>`, inline: true },
            { name: "Type", value: pending.type, inline: true }
        )
        .addFields({ name: "Email", value: pending.email, inline: true });

    switch (pending.type) {
        case "student":
            embed.addFields(
                { name: "Program", value: pending.program, inline: true },
                { name: "Year", value: pending.year.toString(), inline: true }
            );
            break;
        case "alumni":
            embed.addFields(
                { name: "Grad Year", value: pending.alumni_year_graduated.toString(), inline: true }
            );
            break;
        case "instructor":
            embed.addFields(
                { name: "Courses Taught", value: pending.instructor_courses_taught, inline: true },
                { name: "Courses Enrolled", value: pending.instructor_courses_enrolled, inline: true }
            );
            break;
    }

    return embed;
}