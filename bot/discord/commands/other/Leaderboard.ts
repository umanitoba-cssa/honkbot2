import { SlashCommandBuilder, CommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ButtonInteraction, ComponentType } from "discord.js";
import { RegisterCommand } from "../../../data/Registry";
import { SQLUserLeaderboard } from "../../../database/message_database";
import type { SQLCounters } from '../../../models/SQLCounters';

// Map for readable datapoint names
const datapointNames: Record<string, string> = {
    reactions_sent: 'Reactions Sent',
    reactions_received: 'Reactions Received',
    message_count: 'Message Count',
    thistbh_sent: 'thistbh Sent',
    thistbh_received: 'thistbh Received'
};

export async function hb_init() {
    RegisterCommand(command, execute);
}

export const command = new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("View users with the top messages and reactions.")
    .addStringOption((option) =>
        option
            .setName("datapoint")
            .setDescription("Type of statistic to order by.")
            .addChoices(
                { name: 'Reactions Sent', value: 'reactions_sent' },
                { name: 'Reactions Received', value: 'reactions_received' },
                { name: 'Message Count', value: 'message_count' },
                { name: 'thistbh Sent', value: 'thistbh_sent' },
                { name: 'thistbh Received', value: 'thistbh_received' }
            )
            .setRequired(true)
    );

export async function execute(interaction: CommandInteraction) {
    if (!interaction.guild) {
        await interaction.reply({ content: "This command must be used in a server." });
        return;
    }

    await interaction.deferReply({ ephemeral: true });

    const datapoint = interaction.options.get("datapoint")!.value as keyof SQLCounters;
    const rows = await SQLUserLeaderboard(interaction.guild.id, datapoint);

    if (!rows || rows.length === 0) {
        await interaction.editReply({ content: "No leaderboard data." });
        return;
    }

    const ITEMS_PER_PAGE = 10;
    let currentPage = 0;
    const totalPages = Math.ceil(rows.length / ITEMS_PER_PAGE);

    const generateEmbed = (page: number) => {
        const start = page * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        const pageRows = rows.slice(start, end);

        const embed = new EmbedBuilder()
            .setTitle(`Leaderboard for ${datapointNames[datapoint]}`)
            .setColor(0x50b7fc)
            .setFooter({ text: `Page ${page + 1} of ${totalPages}` });

        const medals: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

        let description = "";
        pageRows.forEach((row, idx) => {
            const rank = start + idx + 1;
            const username = `<@${row.user_id}>`;
            const medal = medals[rank];
            const stat = row[datapoint];
            const prefix = medal ?? `${rank.toString().padStart(2, '0')}.`;
            const formattedStat = medal ? `**${stat}**` : `${stat}`;
            description += `${prefix} ${username}: ${formattedStat}\n`;
        });

        embed.setDescription(description);
        return embed;
    };

    const createButtons = () => {
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId("prevPage")
                .setLabel("⬅️")
                .setStyle(ButtonStyle.Primary)
                .setDisabled(currentPage === 0),
            new ButtonBuilder()
                .setCustomId("nextPage")
                .setLabel("➡️")
                .setStyle(ButtonStyle.Primary)
                .setDisabled(currentPage === totalPages - 1)
        );
        return row;
    };

    const message = await interaction.editReply({
        embeds: [generateEmbed(currentPage)],
        components: [createButtons()]
    });

    // Handle button interactions for pagination
    const collector = message.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 600_000 // 10 min timeout
    });

    collector.on('collect', async (btn: ButtonInteraction) => {
        if (!btn.isButton()) return;
        if (btn.user.id !== interaction.user.id) {
            await btn.reply({ content: "You cannot control this leaderboard.", ephemeral: true });
            return;
        }

        if (btn.customId === "prevPage" && currentPage > 0) currentPage--;
        if (btn.customId === "nextPage" && currentPage < totalPages - 1) currentPage++;

        await btn.update({
            embeds: [generateEmbed(currentPage)],
            components: [createButtons()]
        });
    });
}
