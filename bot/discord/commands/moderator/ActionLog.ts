import {
    SlashCommandBuilder,
    CommandInteraction,
    PermissionFlagsBits,
    GuildMember,
    EmbedBuilder
} from "discord.js";
import { RegisterCommand } from "../../../data/Registry";
import UserInfoEmbed from "../../../templates/embeds/UserInfoEmbed";
import { GetModBans, GetModModnotes, GetVerifiedUser, GetModWarnings } from "../../../database/database";
import ModNoteLogEmbed from "../../../templates/embeds/ModNoteLogEmbed";
import WarningLogEmbed from "../../../templates/embeds/WarnLogEmbed";
import BanLogEmbed from "../../../templates/embeds/BanLogEmbed";

export async function hb_init() {
    RegisterCommand(command, execute);
}

export const command = new SlashCommandBuilder()
    .setName("actionlog")
    .setDescription("View all moderation actions taken by a user.")
    .addUserOption((option) => option.setName("moderator").setDescription("Mod to lookup").setRequired(true))
    .addStringOption((option) => option.setName("type").setDescription("Type of action to filter by").addChoices({name: 'ModNotes', value: 'modnotes'}, {name: 'Warnings', value: "warnings"}, {name: 'Bans', value: "bans"}).setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

export async function execute(interaction: CommandInteraction) {
    if (!interaction.guild) {
        await interaction.reply({ content: "This command must be used in a server." });
        return;
    }

    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;
    const target = interaction.options.get("moderator")!.member as GuildMember;
    const type = interaction.options.get("type")!.value as string;


    if (type == "modnotes") {
        const modNotes = await GetModModnotes(guild.id, target.id);
        const mEmbeds = await Promise.all(
            modNotes.map(async (note) => ({
                time: Date.parse(note.created),
                embed: await ModNoteLogEmbed(guild.client, note)
            }))
        );
        const orderedEmbeds = mEmbeds
        .filter((e) => e.embed)
        .sort((a, b) => a.time - b.time)
        .map((e) => e.embed) as EmbedBuilder[];

        if (orderedEmbeds.length <= 0) {
            await interaction.editReply({ content: `No logs found.` });
            return;
        }

        const embeds = [...orderedEmbeds]
    
        await interaction.editReply({ embeds });
    } else if (type == "warnings") {
        const warns = await GetModWarnings(guild.id, target.id);
        const mEmbeds = await Promise.all(
            warns.map(async (warn) => ({
                time: Date.parse(warn.created),
                embed: await WarningLogEmbed(guild.client, warn)
            }))
        );
        const orderedEmbeds = mEmbeds
        .filter((e) => e.embed)
        .sort((a, b) => a.time - b.time)
        .map((e) => e.embed) as EmbedBuilder[];

        if (orderedEmbeds.length <= 0) {
            await interaction.editReply({ content: `No logs found.` });
            return;
        }

        const embeds = [...orderedEmbeds]
    
        await interaction.editReply({ embeds });
    } else if (type == "bans") {    
    const bans = await GetModBans(guild.id, target.id);
    const mEmbeds = await Promise.all(
        bans.map(async (ban) => ({
            time: Date.parse(ban.created),
            embed: await BanLogEmbed(guild.client, ban)
        }))
    );
    const orderedEmbeds = mEmbeds
        .filter((e) => e.embed)
        .sort((a, b) => a.time - b.time)
        .map((e) => e.embed) as EmbedBuilder[];

        if (orderedEmbeds.length <= 0) {
            await interaction.editReply({ content: `No logs found.` });
            return;
        }

        const embeds = [...orderedEmbeds]
    
        await interaction.editReply({ embeds });
}



}
