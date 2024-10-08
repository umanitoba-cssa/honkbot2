import {
    SlashCommandBuilder,
    CommandInteraction,
    PermissionFlagsBits,
    GuildMember,
    EmbedBuilder
} from "discord.js";
import { RegisterCommand } from "../../../data/Registry";
import UserInfoEmbed from "../../../templates/embeds/UserInfoEmbed";
import { GetBans, GetModnotes, GetVerifiedUser, GetWarnings } from "../../../database/database";
import ModNoteLogEmbed from "../../../templates/embeds/ModNoteLogEmbed";
import WarningLogEmbed from "../../../templates/embeds/WarnLogEmbed";
import BanLogEmbed from "../../../templates/embeds/BanLogEmbed";

export async function hb_init() {
    RegisterCommand(command, execute);
}

export const command = new SlashCommandBuilder()
    .setName("userlog")
    .setDescription("View verified information for a user and all notes, warns, and bans.")
    .addUserOption((option) => option.setName("user").setDescription("User to display").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

export async function execute(interaction: CommandInteraction) {
    if (!interaction.guild) {
        await interaction.reply({ content: "This command must be used in a server." });
        return;
    }

    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;
    const target = interaction.options.get("user")!.member as GuildMember;
    const userinfo = await GetVerifiedUser(guild.id, target.id);

    if (!userinfo) {
        await interaction.editReply({
            content: `Information not found for <@${target.id}>, the user has not completed verification.`
        });
        return;
    }

    const modNotes = await GetModnotes(guild.id, target.id);
    const warns = await GetWarnings(guild.id, target.id);
    const bans = await GetBans(guild.id, target.id);

    //TODO: sort by 'created'
    const userInfoEmbed = await UserInfoEmbed(guild.client, userinfo);

    if (!userInfoEmbed) {
        await interaction.editReply({ content: `User not found.` });
        return;
    }

    const mEmbeds = await Promise.all(
        modNotes.map(async (note) => ({
            time: Date.parse(note.created),
            embed: await ModNoteLogEmbed(guild.client, note)
        }))
    );

    const wEmbeds = await Promise.all(
        warns.map(async (warn) => ({
            time: Date.parse(warn.created),
            embed: await WarningLogEmbed(guild.client, warn)
        }))
    );

    const bEmbeds = await Promise.all(
        bans.map(async (ban) => ({
            time: Date.parse(ban.created),
            embed: await BanLogEmbed(guild.client, ban)
        }))
    );

    const orderedEmbeds = mEmbeds
        .concat(wEmbeds)
        .concat(bEmbeds)
        .filter((e) => e.embed)
        .sort((a, b) => a.time - b.time)
        .map((e) => e.embed) as EmbedBuilder[];

    const embeds = [userInfoEmbed, ...orderedEmbeds];

    if (embeds.length <= 0) {
        await interaction.editReply({ content: `User not found.` });
        return;
    }

    await interaction.editReply({ embeds });
}
