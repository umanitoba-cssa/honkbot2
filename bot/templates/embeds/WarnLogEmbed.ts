import { Client, EmbedBuilder } from "discord.js";
import type { Warning } from "../../models/Warning";
import { GetVerifiedUser } from "../../database/database";

export default async function WarningLogEmbed(client: Client, warning: Warning) {
    const guild = client.guilds.cache.get(warning.guild_id);

    if (!guild) {
        return;
    }

    const issuer = guild.members.cache.get(warning.issuer_user_id);
    const target = guild.members.cache.get(warning.target_user_id);

    if (!issuer || !target) {
        return;
    }

    const targetInfo = await GetVerifiedUser(warning.guild_id, warning.target_user_id);

    return new EmbedBuilder()
        .setColor("#ffff00")
        .setTitle("Warning Issued")
        .addFields(
            { name: "Name", value: targetInfo?.name ?? "<not found>", inline: true },
            { name: "Handle", value: `<@${target.id}>`, inline: true },
            { name: "Reason", value: warning.reason, inline: false },
            { name: "Strike", value: warning.strike ? "Yes" : "No", inline: true },
            { name: "Issued by", value: `<@${issuer.id}>`, inline: true }
        );
}
