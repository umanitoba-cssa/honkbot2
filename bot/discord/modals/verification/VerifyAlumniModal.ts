import {
    ModalBuilder,
    type BaseInteraction,
    TextInputBuilder,
    ActionRowBuilder,
    TextInputStyle,
    ButtonInteraction,
    CommandInteraction,
    ModalSubmitInteraction
} from "discord.js";
import { RegisterModalHandler } from "../../../data/Registry";
import { Events } from "../../../data/Events";
import { CreatePendingAlumniVerification, CreatePendingStudentVerification, PatchPendingVerification } from "../../../database/database";
import { SendVerificationEmail } from "../../../services/email";

export async function hb_init() {
    RegisterModalHandler(Events.Modal.VerifyAlumniModal, VerifyAlumniModal.submit);
}

export module VerifyAlumniModal {
    export async function show(interaction: ButtonInteraction | CommandInteraction) {
        const modal = new ModalBuilder()
            .setCustomId(Events.Modal.VerifyAlumniModal)
            .setTitle("Alumni Verification");

        const nameInput = new TextInputBuilder()
            .setCustomId("alumni-name")
            .setLabel("Full Name as displayed on your diploma")
            .setRequired(true)
            .setPlaceholder("Lorem J. Ipsum")
            .setStyle(TextInputStyle.Short);

        const emailInput = new TextInputBuilder()
            .setCustomId("contact-email")
            .setLabel("Contact Email Address")
            .setPlaceholder("All valid email accounts are accepted")
            .setRequired(true)
            .setStyle(TextInputStyle.Short);

        const programInput = new TextInputBuilder()
            .setCustomId("alumni-program")
            .setLabel("Program of Study")
            .setRequired(true)
            .setPlaceholder("e.g. Computer Science, Computer Engineering, etc.")
            .setStyle(TextInputStyle.Short);

        const yearInput = new TextInputBuilder()
            .setCustomId("grad-year")
            .setLabel("Year of Graduation")
            .setRequired(true)
            .setPlaceholder("2020, 2021, etc")
            .setStyle(TextInputStyle.Short)
            .setMaxLength(4);

        const ar1 = new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput);
        const ar2 = new ActionRowBuilder<TextInputBuilder>().addComponents(emailInput);
        const ar3 = new ActionRowBuilder<TextInputBuilder>().addComponents(programInput);
        const ar4 = new ActionRowBuilder<TextInputBuilder>().addComponents(yearInput);

        modal.addComponents(ar1, ar2, ar3, ar4);

        await interaction.showModal(modal);
    }

    export async function submit(interaction: ModalSubmitInteraction) {
        await interaction.reply({
            content: "Submitting your verification request, please wait...",
            ephemeral: true
        });

        const guildId = interaction.guildId;
        const userId = interaction.user.id;

        if (!guildId) {
            await interaction.editReply({ content: "This modal must be run in a server" });
            return;
        }

        const fullName = interaction.fields.getTextInputValue("alumni-name");
        const email = interaction.fields.getTextInputValue("contact-email");
        const program = interaction.fields.getTextInputValue("alumni-program");
        const year = interaction.fields.getTextInputValue("grad-year");


        // check if email format is valid
        if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
            await interaction.editReply({ content: "Email must be a valid email address." });
            return;
        }

        const yearNumber = parseInt(year);
        if (isNaN(yearNumber)) {
            await interaction.editReply({ content: "Year of graduation must be a number." });
            return;
        }

        const record = await CreatePendingAlumniVerification(
            guildId,
            userId,
            fullName,
            email,
            program,
            yearNumber
        );

        try {
            const name = await SendVerificationEmail(guildId, email, record.id);
            if (name) {
                await PatchPendingVerification(record.id, { name });
            }
        } catch (error) {
            console.error(error);
            await interaction.editReply({
                content:
                    `There was an error while sending the verification email. Please contact ${process.env.BOT_ADMIN} for assistance.`
            });
            return;
        }

        const response = [
            `Thank you! A verification code has been sent to your email (${email}). Once you receive the code you can complete your verification request by entering the following command:`,
            "```",
            `/verify [code]`,
            "```",
            "- If you entered the wrong email address, please resubmit the verification form.",
            `- If you do not receive an email within 30 minutes, contact ${process.env.BOT_ADMIN} for assistance.`
        ].join("\n");

        await interaction.editReply({ content: response });
    }
}
