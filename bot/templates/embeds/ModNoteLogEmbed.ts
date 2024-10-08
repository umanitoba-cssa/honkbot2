import { Client, EmbedBuilder } from "discord.js";
import type { Modnote } from "../../models/Modnote";
import { GetVerifiedUser } from "../../database/database";

export default async function ModNoteLogEmbed(client: Client, modnote: Modnote) {
    const guild = client.guilds.cache.get(modnote.guild_id);

    if (!guild) {
        return;
    }

    const issuer = guild.members.cache.get(modnote.issuer_user_id);
    const target = guild.members.cache.get(modnote.target_user_id);

    if (!issuer || !target) {
        return;
    }

    const targetInfo = await GetVerifiedUser(modnote.guild_id, modnote.target_user_id);

    return new EmbedBuilder()
        .setColor("#4287f5")
        .setTitle("Modnote Recorded")
        .addFields(
            { name: "Name", value: targetInfo?.name ?? "<not found>", inline: true },
            { name: "Handle", value: `<@${target.id}>`, inline: true },
            { name: "Note", value: modnote.content, inline: false },
            { name: "Issued by", value: `<@${issuer.id}>`, inline: true }
        );
}