import { REST, Routes } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { LoadAllModules, _GetAllCommands } from './data/Registry';

if (!process.env.DISCORD_TOKEN) {
    throw new Error('DISCORD_TOKEN is not set');
}

if (!process.env.DISCORD_CLIENT_ID) {
    throw new Error('DISCORD_CLIENT_ID is not set');
}

await LoadAllModules();
const commands = _GetAllCommands().map(command => command.toJSON());

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		const data: any = await rest.put(
			Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID!, process.env.DISCORD_GUILD_ID!),
			{ body: commands },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		console.error(error);
	}
})();