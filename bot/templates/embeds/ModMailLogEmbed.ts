import { Client, EmbedBuilder, Guild } from "discord.js";
import type { ModMail } from "../../models/ModMail";
import { GetVerifiedUser } from "../../database/database";

export default async function ModMailLogEmbed(guild: Guild, modmail: ModMail) {

    if (!guild) {
        console.log("no guild");
        return;
    }

    let issuer = guild.members.cache.get(modmail.issuer_user_id);

    if (!issuer) {
        try {
            issuer = await guild.members.fetch(modmail.issuer_user_id);
        } catch (error) {
            console.log("no issuer");
            return;
        }
    }

    if (!modmail.incoming) {
        const target = guild.members.cache.get(modmail.target_user_id);

        if (!target) {
            console.log("no target");
            return;
        }
        return new EmbedBuilder()
        .setColor("#4287f5")
        .setTitle("Modmail")
        .addFields(
            { name: "Message", value: `${modmail.content}`, inline: false },
            { name: "Sent by", value: `<@${issuer.id}>`, inline: false },
            { name: "Sent to", value: `<@${target.id}>`, inline: false }
        );
    } else {
    return new EmbedBuilder()
        .setColor("#4287f5")
        .setTitle("Modmail")
        .addFields(
            { name: "Message", value: `${modmail.content}`, inline: false },
            { name: "Sent by", value: `<@${issuer.id}>`, inline: false }
        );
    }
}