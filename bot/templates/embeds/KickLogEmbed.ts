import { Client, EmbedBuilder } from "discord.js";
import type { Kick } from "../../models/Kick";
import { GetVerifiedUser } from "../../database/database";

export default async function BanLogEmbed(client: Client, kick: Kick) {
    const guild = client.guilds.cache.get(kick.guild_id);

    if (!guild) {
        return;
    }

    const issuer = guild.members.cache.get(kick.issuer_user_id);
    const target = guild.members.cache.get(kick.target_user_id);

    if (!issuer || !target) {
        return;
    }

    const targetInfo = await GetVerifiedUser(kick.guild_id, kick.target_user_id);

    return new EmbedBuilder()
        .setColor("#ff0000")
        .setTitle("Kick Issued")
        .addFields(
            { name: "Name", value: targetInfo?.name ?? "<not found>", inline: true },
            { name: "Handle", value: `<@${target.id}>`, inline: true },
            { name: "Reason", value: kick.reason, inline: false },
            { name: "Automatically issued", value: kick.automatic ? "Yes" : "No", inline: true },
            { name: "Issued by", value: `<@${issuer.id}>`, inline: true }
        );
}
