import { Client, EmbedBuilder } from "discord.js";
import type { Ban } from "../../models/Ban";
import { GetVerifiedUser } from "../../database/database";

export default async function BanLogEmbed(client: Client, ban: Ban) {
    const guild = client.guilds.cache.get(ban.guild_id);

    if (!guild) {
        return;
    }

    const issuer = guild.members.cache.get(ban.issuer_user_id);
    const target = guild.members.cache.get(ban.target_user_id);

    if (!issuer || !target) {
        return;
    }

    const targetInfo = await GetVerifiedUser(ban.guild_id, ban.target_user_id);

    return new EmbedBuilder()
        .setColor("#ff0000")
        .setTitle("Ban Issued")
        .addFields(
            { name: "Name", value: targetInfo?.name ?? "<not found>", inline: true },
            { name: "Handle", value: `<@${target.id}>`, inline: true },
            { name: "Reason", value: ban.reason, inline: false },
            { name: "Automatically issued", value: ban.automatic ? "Yes" : "No", inline: true },
            { name: "Issued by", value: `<@${issuer.id}>`, inline: true }
        );
}
