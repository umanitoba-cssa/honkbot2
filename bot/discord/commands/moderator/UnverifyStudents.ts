import { SlashCommandBuilder, CommandInteraction, PermissionFlagsBits } from "discord.js";
import { RegisterCommand } from "../../../data/Registry";
import { GetGuildSettings, GetAllVerifiedStudents, RemoveVerifiedUser } from "../../../database/database";

// 5 concurrent members per chunk keeps burst API usage modest
const CHUNK_SIZE = 5;
// 1 s between chunks stays well within Discord's per-route rate-limit buckets
const CHUNK_DELAY_MS = 1000;
// Edit the progress reply at most once per this many members to avoid editReply rate-limits
const PROGRESS_INTERVAL = 25;

function sleep(ms: number) {
    return new Promise<void>(resolve => setTimeout(resolve, ms));
}

export async function hb_init() {
    RegisterCommand(command, execute);
}

export const command = new SlashCommandBuilder()
    .setName("unverify-students")
    .setDescription("Remove verification from all verified students (preserves alumni)")
    .addBooleanOption((option) =>
        option.setName("confirm")
              .setDescription("Confirm that you want to unverify all students")
              .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: CommandInteraction) {
    if (!interaction.guild) {
        await interaction.reply({ content: "This command must be used in a server.", ephemeral: true });
        return;
    }

    const confirm = interaction.options.get("confirm")?.value as boolean;

    if (!confirm) {
        await interaction.reply({
            content: "You must confirm this action by setting the `confirm` parameter to `true`. This action will remove verification from all students but preserve alumni.",
            ephemeral: true
        });
        return;
    }

    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;
    const guildSettings = await GetGuildSettings(guild.id);

    if (!guildSettings) {
        await interaction.editReply({ content: "Guild settings not found. Please configure the bot first." });
        return;
    }

    try {
        const verifiedStudents = await GetAllVerifiedStudents(guild.id);

        if (verifiedStudents.length === 0) {
            await interaction.editReply({ content: "No verified students found to unverify." });
            return;
        }

        // Bulk-fetch all guild members once so individual lookups hit the in-memory cache
        await guild.members.fetch();

        const total = verifiedStudents.length;
        let processedCount = 0;
        let errorCount = 0;
        const errors: string[] = [];

        await interaction.editReply({ content: `Starting — 0 / ${total} processed…` });

        for (let i = 0; i < total; i += CHUNK_SIZE) {
            const chunk = verifiedStudents.slice(i, i + CHUNK_SIZE);

            const results = await Promise.allSettled(
                chunk.map(async (student) => {
                    const member = guild.members.cache.get(student.user_id);

                    if (member) {
                        // Compute the final role list in one pass, then apply it with a single API call
                        // instead of separate remove + add calls
                        const finalRoles = member.roles.cache
                            .filter(r =>
                                r.id !== guildSettings.verified_role_id &&
                                r.id !== guildSettings.student_role_id
                            )
                            .map(r => r.id);

                        if (guildSettings.preverified_role_id && !member.roles.cache.has(guildSettings.preverified_role_id)) {
                            finalRoles.push(guildSettings.preverified_role_id);
                        }

                        await member.roles.set(finalRoles);
                    }

                    await RemoveVerifiedUser(student.id);
                })
            );

            for (const result of results) {
                if (result.status === "fulfilled") {
                    processedCount++;
                } else {
                    errorCount++;
                    const msg = `Error processing user: ${result.reason}`;
                    errors.push(msg);
                    console.error(msg);
                }
            }

            const done = i + chunk.length;
            if (done % PROGRESS_INTERVAL < CHUNK_SIZE || done >= total) {
                await interaction.editReply({ content: `Processing — ${done} / ${total}…` });
            }

            if (done < total) {
                await sleep(CHUNK_DELAY_MS);
            }
        }

        let summary = `**Unverification Complete**\n`;
        summary += `**Summary:**\n`;
        summary += `• Total students found: ${total}\n`;
        summary += `• Successfully processed: ${processedCount}\n`;
        summary += `• Errors: ${errorCount}\n\n`;

        if (processedCount > 0) {
            summary += `**Actions taken for each student:**\n`;
            summary += `• Removed verified & student roles\n`;
            summary += `• Added preverified role\n`;
            summary += `• Removed verification record from database\n\n`;
        }

        if (errorCount > 0) {
            summary += `**Errors encountered:**\n`;
            for (const error of errors.slice(0, 5)) {
                summary += `• ${error}\n`;
            }
            if (errors.length > 5) {
                summary += `• … and ${errors.length - 5} more (check console logs)\n`;
            }
        }

        await interaction.editReply({ content: summary });

    } catch (error) {
        console.error("Error in unverify-students command:", error);
        await interaction.editReply({
            content: `An error occurred while processing the unverification: ${error}`
        });
    }
}
