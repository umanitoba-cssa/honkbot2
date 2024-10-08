import { EmbedBuilder, type CommandInteraction, type GuildMember, Client, Guild, ButtonBuilder, ActionRowBuilder, ButtonStyle, type MessageActionRowComponentBuilder } from "discord.js";
import type { PendingVerification, VerifiedUser } from "../models/VerifiedUser";
import type GuildSettings from "../models/GuildSettings";
import { GetGuildSettings, GetVerifiedUser } from "../database/database";
import type { Warning } from "../models/Warning";
import type { Ban } from "../models/Ban";
import type { Kick } from "../models/Kick";
import type { Timeout } from "../models/Timeout";
import type { Modnote } from "../models/Modnote";
import BanLogEmbed from "../templates/embeds/BanLogEmbed";
import KickLogEmbed from "../templates/embeds/KickLogEmbed";
import TimeoutLogEmbed from "../templates/embeds/TimeoutLogEmbed";
import WarningLogEmbed from "../templates/embeds/WarnLogEmbed";
import ModNoteLogEmbed from "../templates/embeds/ModNoteLogEmbed";
import ModMailLogEmbed from "../templates/embeds/ModMailLogEmbed";
import VerificationLogEmbed from "../templates/embeds/VerificationLogEmbed";
import type { ModMail } from "../models/ModMail";
import AlumniVerificationLogEmbed from "../templates/embeds/AlumniVerificationLogEmbed";
import ReVerificationLogEmbed from "../templates/embeds/ReVerificationLogEmbed";

async function SendModLogEmbed(guild: Guild, embed: EmbedBuilder | undefined) {
    if (!guild || !embed) {
        return;
    }

    const guildSettings = await GetGuildSettings(guild.id);

    if (!guildSettings) {
        return;
    }

    const modlogChannel = guild?.channels.cache.get(guildSettings.modlog_channel_id);

    if (!modlogChannel || !modlogChannel.isTextBased()) {
        return;
    }

    await modlogChannel.send({ embeds: [embed] });
}

async function SendModMailEmbed(guild: Guild, embed: EmbedBuilder | undefined) {
    if (!guild) {
        console.log("b");
        return;
    }

    if (!embed) {
        console.log("c");
        return;
    }

    const guildSettings = await GetGuildSettings(guild.id);

    if (!guildSettings) {
        return;
    }

    const modMailChannel = guild?.channels.cache.get(guildSettings.modmail_channel_id);
    console.log("a");

    if (!modMailChannel || !modMailChannel.isTextBased()) {
        return;
    }

    await modMailChannel.send({ embeds: [embed] });
}

async function SendVerificationEmbed(guild: Guild, embed: EmbedBuilder | undefined) {
    if (!guild || !embed) {
        return;
    }

    const guildSettings = await GetGuildSettings(guild.id);

    if (!guildSettings) {
        return;
    }

    const verificationLogChannel = guild?.channels.cache.get(guildSettings.verification_logs_channel_id);

    if (!verificationLogChannel || !verificationLogChannel.isTextBased()) {
        return;
    }

    await verificationLogChannel.send({ embeds: [embed] });
}

export async function LogBan(interaction: CommandInteraction, ban: Ban) {
    const guild = interaction.guild;

    if (guild) {
        SendModLogEmbed(guild, await BanLogEmbed(guild.client, ban));
    }
}

export async function LogKick(interaction: CommandInteraction, kick: Kick) {
    const guild = interaction.guild;

    if (guild) {
        SendModLogEmbed(guild, await KickLogEmbed(guild.client, kick));
    }
}

export async function LogTimeout(interaction: CommandInteraction, timeout: Timeout) {
    const guild = interaction.guild;

    if (guild) {
        SendModLogEmbed(guild, await TimeoutLogEmbed(guild.client, timeout));
    }
}

export async function LogWarning(interaction: CommandInteraction, warning: Warning) {
    const guild = interaction.guild;

    if (guild) {
        SendModLogEmbed(guild, await WarningLogEmbed(guild.client, warning));
    }
}

export async function LogModnote(interaction: CommandInteraction, modnote: Modnote) {
    const guild = interaction.guild;

    if (guild) {
        SendModLogEmbed(guild, await ModNoteLogEmbed(guild.client, modnote));
    }
}

export async function LogModMail(guild: Guild, modmail: ModMail) {
    if (guild) {
        SendModMailEmbed(guild, await ModMailLogEmbed(guild, modmail));
    }
}

export async function LogVerification(
    interaction: CommandInteraction,
    pending: PendingVerification
) {
    const guild = interaction.guild;

    if (guild) {
        SendVerificationEmbed(guild, await VerificationLogEmbed(guild.client, pending));
    }
}

export async function LogReVerification(
    guild: Guild,
    verified_user: VerifiedUser
) {
    if (guild) {
        SendVerificationEmbed(guild, await ReVerificationLogEmbed(guild.client, verified_user));
    }
}

export async function LogPendingVerification(
    interaction: CommandInteraction,
    pending: PendingVerification
) {
    const guild = interaction.guild;

    if (guild) {
        SendVerificationEmbed(guild, await AlumniVerificationLogEmbed(guild.client, pending));
    }
}