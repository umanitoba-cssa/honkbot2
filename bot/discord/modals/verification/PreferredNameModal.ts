import {
    ModalBuilder,
    TextInputBuilder,
    ActionRowBuilder,
    TextInputStyle,
    ButtonInteraction,
    ModalSubmitInteraction,
    GuildMember
} from "discord.js";
import { RegisterModalHandler, RegisterButtonHandler } from "../../../data/Registry";
import { Events } from "../../../data/Events";

export async function hb_init() {
    RegisterModalHandler(Events.Modal.PreferredNameModal, PreferredNameModal.submit);
    RegisterButtonHandler(Events.Button.SetPreferredName, PreferredNameModal.showFromButton);
}

export module PreferredNameModal {
    export async function showFromButton(interaction: ButtonInteraction) {
        const modal = new ModalBuilder()
            .setCustomId(Events.Modal.PreferredNameModal)
            .setTitle("Set Preferred Name");

        const preferredNameInput = new TextInputBuilder()
            .setCustomId("preferred-name")
            .setLabel("Preferred Name")
            .setRequired(true)
            .setPlaceholder("What you'd like to be called in the server")
            .setStyle(TextInputStyle.Short)
            .setMaxLength(32); // Discord nickname limit

        const ar1 = new ActionRowBuilder<TextInputBuilder>().addComponents(preferredNameInput);
        modal.addComponents(ar1);

        await interaction.showModal(modal);
    }

    export async function submit(interaction: ModalSubmitInteraction) {
        await interaction.deferReply({ ephemeral: true });

        const preferredName = interaction.fields.getTextInputValue("preferred-name").trim();
        
        if (!preferredName) {
            await interaction.editReply({ content: "Preferred name cannot be empty." });
            return;
        }

        const member = interaction.member as GuildMember;
        if (!member) {
            await interaction.editReply({ content: "You must be in the server to set a nickname." });
            return;
        }

        try {
            await member.setNickname(preferredName);
            await interaction.editReply({ 
                content: `Perfect! Your nickname has been set to **${preferredName}**!\n\n You'll receive your roles once you verify your email using the code sent to your inbox using \`/verify [code]\`.` 
            });
        } catch (error) {
            console.error(`Failed to set nickname for ${member.id}:`, error);
            
            // Check specific reasons why nickname setting might fail
            let errorMessage = "I couldn't set your nickname. ";
            
            if (member.guild.ownerId === member.id) {
                errorMessage += "Server owners cannot have their nicknames changed by bots.";
            } else if (error instanceof Error) {
                if ('code' in error && error.code === 50013) {
                    errorMessage += "I don't have permission to change your nickname. This might be because you have a role higher than mine in the role hierarchy.";
                } else if ('code' in error && error.code === 50035) {
                    errorMessage += "The nickname you chose is invalid. Please try a shorter name or avoid special characters.";
                } else {
                    errorMessage += `Unknown error: ${error.message}`;
                }
            } else {
                errorMessage += "An unexpected error occurred.";
            }
            
            errorMessage += "\n\n Don't worry! You can manually change your nickname in server settings if needed.";
            
            await interaction.editReply({ content: errorMessage });
        }
    }
}
