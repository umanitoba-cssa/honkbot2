import { Client, EmbedBuilder } from "discord.js";
import type { VerifiedUser } from "../../models/VerifiedUser";

export default async function UserInfoEmbed(client: Client, user: VerifiedUser) {
    const guild = client.guilds.cache.get(user.guild_id);

    if (!guild) {
        return;
    }

    const member = guild.members.cache.get(user.user_id);

    if (!member) {
        return;
    }

    const embed = new EmbedBuilder()
        .setColor("#00ff00")
        .setTitle("User Info")
        .addFields(
            { name: "Name", value: user.name, inline: true },
            { name: "Handle", value: `<@${member.id}>`, inline: true },
            { name: "Type", value: user.type, inline: true }
        )
        .addFields({ name: "Email", value: user.email, inline: true });

    switch (user.type) {
        case "student":
            embed.addFields(
                { name: "Program", value: user.program, inline: true },
                { name: "Year", value: user.year.toString(), inline: true }
            );
            break;
        case "alumni":
            break;
        case "instructor":
            embed.addFields(
                { name: "Courses Taught", value: user.instructor_courses_taught, inline: true },
                { name: "Courses Enrolled", value: user.instructor_courses_enrolled, inline: true }
            );
            break;
    }

    return embed;
}
