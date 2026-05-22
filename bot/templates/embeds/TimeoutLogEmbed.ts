import { Client, EmbedBuilder } from "discord.js";
import type { Timeout } from "../../models/Timeout";
import { GetVerifiedUser } from "../../database/database";

export default async function timeoutLogEmbed(client: Client, timeout: Timeout) {
    const guild = client.guilds.cache.get(timeout.guild_id);

    if (!guild) {
        return;
    }

    const issuer = guild.members.cache.get(timeout.issuer_user_id);
    const target = guild.members.cache.get(timeout.target_user_id);

    if (!issuer || !target) {
        return;
    }

    const targetInfo = await GetVerifiedUser(timeout.guild_id, timeout.target_user_id);

    return new EmbedBuilder()
        .setColor("#ff0000")
        .setTitle("Timeout Issued")
        .addFields(
            { name: "Name", value: targetInfo?.name ?? "<not found>", inline: true },
            { name: "Handle", value: `<@${target.id}>`, inline: true },
            { name: "Reason", value: timeout.reason, inline: false },
            { name: "Duration", value: timeout.duration.toString(), inline: true},
            { name: "Automatically issued", value: timeout.automatic ? "Yes" : "No", inline: true },
            { name: "Issued by", value: `<@${issuer.id}>`, inline: true }
        );
}
