import { SlashCommandBuilder, CommandInteraction, PermissionFlagsBits, GuildMember } from "discord.js";
import { RegisterCommand } from "../../../data/Registry";
import { AddModMail, AddModnote } from "../../../database/database";
import { LogModMail, LogModnote } from "../../../services/logs";

const messageTemplates : Record<string, string> = {
    nickname: "Hello! This is just a friendly reminder that according to our server guidelines, we ask that users"
    + " change their server nickname to match the name you prefer to be called in person. This is so that everyone"
    + " can have an idea of who they are talking to! Please change your nickname accordingly. If you have any questions, feel free to DM this bot!",

    verify: "Hello! I saw your message in #discord-registration . It seems that discord did not recognize you were typing a command-"
    + " can you try typing /verify first, then pasting your verification code in the box that pops up? Feel free to DM this bot if you have any questions."
}


export async function hb_init() {
    RegisterCommand(command, execute);
}

export const command = new SlashCommandBuilder()
    .setName("message")
    .setDescription("Message a server user from the bot. This will only be visible to server moderators.")
    .addUserOption((option) => option.setName("user").setDescription("User to message").setRequired(true))
    .addStringOption((option) =>
        option
            .setName("template")
            .setDescription("Choose prefilled message template.")
            .setRequired(false)
            .addChoices(
                {
                    name: "Change ur nickname pls",
                    value: "nickname",
                },
                {
                    name: "Verify gone wrong",
                    value: "verify",
                }
            )
    )
    .addStringOption((option) =>
        option
            .setName("custom")
            .setDescription("Custom message content to send to the user.")
            .setRequired(false)
        )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

export async function execute(interaction: CommandInteraction) {
    if (!interaction.guild) {
        await interaction.reply({ content: "This command must be used in a server." });
        return;
    }

    const selectedTemplate = interaction.options.get("template")?.value as string | undefined;
    const customMessage = interaction.options.get("custom")?.value as string | undefined;

    // Use the custom message if provided, otherwise use the prefilled template message
    const content = customMessage?.trim() || (selectedTemplate? messageTemplates[selectedTemplate]: undefined);

    if (!content) {
        await interaction.reply({ 
            content: "Please select a message template or provide a custom message.",
            ephemeral: true
        });
        return;
    }

    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;
    const issuer = interaction.member! as GuildMember;
    const target = interaction.options.get("user")!.member as GuildMember;
    const dm = await target.createDM().catch(error => {
        console.log(error);
        return null;
    });

    if (!dm) {
        return interaction.editReply({ content: `Failed to send message to <@${target.id}>.` });
    }

    await dm.send(
        `## A message from the moderators
        ${content}

        Sent on behalf of the moderators by <@${issuer.user.id}>`.replace(/  +/g, "")
    );

    const newcontent = `Mod Message Sent: ${content}`;

    const modnote = await AddModMail(guild.id, target.id, issuer.id, newcontent, false);
    await LogModMail(interaction.guild, modnote);

    await interaction.editReply({ content: `Message sent to <@${target.id}>.` });

    
}
