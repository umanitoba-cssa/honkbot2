import { ButtonInteraction, ChatInputCommandInteraction, Client, Events, ModalSubmitInteraction, type Interaction } from "discord.js";
import { GetButtonHandler, GetCommand, GetCommandHandler, GetModalHandler } from "../data/Registry";
import { Events as InteractionEvents } from "../data/Events";

export const name: Events = Events.InteractionCreate;

export const execute = async (interaction: Interaction) => {
    const client = interaction.client;

    if (interaction.isChatInputCommand()) {
        await processChatCommand(client, interaction);
    } else if (interaction.isButton()) {
        await processButton(client, interaction);
    } else if (interaction.isModalSubmit()) {
        await processModalSubmit(client, interaction);
    } else {
        console.log(`Unhandled interaction type: ${interaction.type}`);
    }
}

async function processChatCommand(client: Client, interaction: ChatInputCommandInteraction) {
    const commandHandler = GetCommandHandler(interaction.commandName);
    if (!commandHandler) return;

    try {
        await commandHandler(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true});
        } else {
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
}

async function processButton(client: Client, interaction: ButtonInteraction)  {
    const buttonHandler = GetButtonHandler(interaction.customId);
    if (!buttonHandler) return;

    try {
        await buttonHandler(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this button!', ephemeral: true });
    }
}

async function processModalSubmit(client: Client, interaction: ModalSubmitInteraction) {
    const modalHandler = GetModalHandler(interaction.customId);
    if (!modalHandler) return;

    try {
        await modalHandler(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this modal!', ephemeral: true });
    }
}