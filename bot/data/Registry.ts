import { ButtonInteraction, Collection, CommandInteraction, ModalSubmitInteraction, type SlashCommandBuilder, type SlashCommandOptionsOnlyBuilder } from "discord.js";
import type { Events } from "./Events";
import fs from 'fs';
import path from 'path';

export type SlashCommand = SlashCommandBuilder | SlashCommandOptionsOnlyBuilder | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">

const _commands: Collection<string, SlashCommand> = new Collection();
const _commandHandlers: Collection<string, (interaction: CommandInteraction) => void> = new Collection();
const _modalHandlers: Collection<string, (interaction: ModalSubmitInteraction) => void> = new Collection();
const _buttonHandlers: Collection<string, (interaction: ButtonInteraction) => void> = new Collection();

export function RegisterCommand(command: SlashCommand, handler: (interaction: CommandInteraction) => void) {
    _commands.set(command.name, command);
    _commandHandlers.set(command.name, handler);
}

export function GetCommand(name: string): SlashCommand | undefined {
    return _commands.get(name);
}

export function _GetAllCommands(): Collection<string, SlashCommand> {
    return _commands.clone();
}

export function GetCommandHandler(name: string): ((interaction: CommandInteraction) => void) | undefined {
    return _commandHandlers.get(name);
}

export function RegisterModalHandler(id: Events.Modal, handler: (interaction: ModalSubmitInteraction) => void) {
    _modalHandlers.set(id, handler);
}

export function GetModalHandler(id: string): ((interaction: ModalSubmitInteraction) => void) | undefined {
    return _modalHandlers.get(id);
}

export function RegisterButtonHandler(id: Events.Button, handler: (interaction: ButtonInteraction) => void) {
    _buttonHandlers.set(id, handler);
}

export function GetButtonHandler(id: string): ((interaction: ButtonInteraction) => void) | undefined {
    return _buttonHandlers.get(id);
}

export async function LoadAllModules() {
    const discordModulePath = path.join(import.meta.dir, '../discord');
    const discordModuleFiles = fs.readdirSync(discordModulePath, {recursive: true, encoding: 'utf-8'}).filter(file => file.endsWith('.ts'));
    for (const file of discordModuleFiles) {
        const filePath = path.join(discordModulePath, file);
        const module = await import(filePath);
        if (module.hb_init) {
            console.log(`Loading module ${file}`);
            await module.hb_init();
        }
    }
}