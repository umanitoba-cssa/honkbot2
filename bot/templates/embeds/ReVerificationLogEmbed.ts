import { Client, EmbedBuilder } from "discord.js";
import type { PendingVerification, VerifiedUser } from "../../models/VerifiedUser";

export default async function ReVerificationLogEmbed(client: Client, verified_user: VerifiedUser) {
    const guild = client.guilds.cache.get(verified_user.guild_id);

    if (!guild) {
        return;
    }

    const member = guild.members.cache.get(verified_user.user_id);

    if (!member) {
        return;
    }

    const embed = new EmbedBuilder()
        .setColor("#ff8c00")
        .setTitle("User Reverified")
        .addFields(
            { name: "Name", value: verified_user.name, inline: true },
            { name: "Handle", value: `<@${member.id}>`, inline: true },
            { name: "Type", value: verified_user.type, inline: true }
        )
        .addFields({ name: "Email", value: verified_user.email, inline: true });

    switch (verified_user.type) {
        case "student":
            embed.addFields(
                { name: "Program", value: verified_user.program, inline: true },
                { name: "Year", value: verified_user.year.toString(), inline: true }
            );
            break;
        case "alumni":
            embed.addFields(
                { name: "Grad Year", value: verified_user.alumni_year_graduated.toString(), inline: true }
            );
            break;
        case "instructor":
            embed.addFields(
                { name: "Courses Taught", value: verified_user.instructor_courses_taught, inline: true },
                { name: "Courses Enrolled", value: verified_user.instructor_courses_enrolled, inline: true }
            );
            break;
    }

    return embed;
}