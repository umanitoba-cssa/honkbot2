import { SlashCommandBuilder, CommandInteraction, PermissionFlagsBits, GuildMember } from "discord.js";
import { RegisterCommand } from "../../../data/Registry";
import { GetGuildSettings, GetAllVerifiedStudents, RemoveVerifiedUser } from "../../../database/database";

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
            content: "❌ You must confirm this action by setting the `confirm` parameter to `true`. This action will remove verification from all students but preserve alumni.", 
            ephemeral: true 
        });
        return;
    }

    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;
    const guildSettings = await GetGuildSettings(guild.id);

    if (!guildSettings) {
        await interaction.editReply({ content: "❌ Guild settings not found. Please configure the bot first." });
        return;
    }

    try {
        // Get all verified students
        const verifiedStudents = await GetAllVerifiedStudents(guild.id);
        
        if (verifiedStudents.length === 0) {
            await interaction.editReply({ content: "✅ No verified students found to unverify." });
            return;
        }

        let processedCount = 0;
        let errorCount = 0;
        const errors: string[] = [];

        // Process each verified student
        for (const student of verifiedStudents) {
            try {
                // Get the guild member
                let member: GuildMember | null = null;
                try {
                    member = await guild.members.fetch(student.user_id);
                } catch (fetchError) {
                    console.warn(`Could not fetch member ${student.user_id}: ${fetchError}`);
                    // Still remove from database even if user is no longer in server
                }

                // Remove roles if member exists
                if (member) {
                    const rolesToRemove: string[] = [];
                    
                    // Remove verified role
                    if (guildSettings.verified_role_id && member.roles.cache.has(guildSettings.verified_role_id)) {
                        rolesToRemove.push(guildSettings.verified_role_id);
                    }
                    
                    // Remove student role
                    if (guildSettings.student_role_id && member.roles.cache.has(guildSettings.student_role_id)) {
                        rolesToRemove.push(guildSettings.student_role_id);
                    }

                    // Remove roles if any to remove
                    if (rolesToRemove.length > 0) {
                        await member.roles.remove(rolesToRemove);
                    }

                    // Add preverified role if they don't have it
                    if (guildSettings.preverified_role_id && !member.roles.cache.has(guildSettings.preverified_role_id)) {
                        await member.roles.add([guildSettings.preverified_role_id]);
                    }
                }

                // Remove from database
                await RemoveVerifiedUser(student.id);
                processedCount++;

            } catch (error) {
                errorCount++;
                const errorMsg = `Error processing user ${student.user_id}: ${error}`;
                errors.push(errorMsg);
                console.error(errorMsg);
            }
        }

        // Create summary message
        let summary = `✅ **Unverification Complete**\n`;
        summary += `📊 **Summary:**\n`;
        summary += `• Total students found: ${verifiedStudents.length}\n`;
        summary += `• Successfully processed: ${processedCount}\n`;
        summary += `• Errors: ${errorCount}\n\n`;
        
        if (processedCount > 0) {
            summary += `🔄 **Actions taken for each student:**\n`;
            summary += `• Removed verified role\n`;
            summary += `• Removed student role\n`;
            summary += `• Added preverified role\n`;
            summary += `• Removed verification record from database\n\n`;
        }

        if (errorCount > 0) {
            summary += `⚠️ **Errors encountered:**\n`;
            // Show first few errors to avoid message being too long
            const errorsToShow = errors.slice(0, 5);
            for (const error of errorsToShow) {
                summary += `• ${error}\n`;
            }
            if (errors.length > 5) {
                summary += `• ... and ${errors.length - 5} more errors (check console logs)\n`;
            }
        }

        await interaction.editReply({ content: summary });

    } catch (error) {
        console.error("Error in unverify-students command:", error);
        await interaction.editReply({ 
            content: `❌ An error occurred while processing the unverification: ${error}` 
        });
    }
}
