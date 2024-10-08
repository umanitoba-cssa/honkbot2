import { Client, ClientApplication, ClientPresence, Collection, GatewayIntentBits, Partials } from "discord.js";
import fs from "fs";
import path from "path";
import { LoadAllModules } from "./data/Registry";

// Check for required environment variables

if (!process.env.DISCORD_CLIENT_ID) {
    throw new Error("DISCORD_CLIENT_ID is not set");
}

if (!process.env.DISCORD_TOKEN) {
    throw new Error("DISCORD_TOKEN is not set");
}

if (!process.env.POCKETBASE_HOST) {
    throw new Error("POCKETBASE_HOST is not set");
}

if (!process.env.POCKETBASE_EMAIL) {
    throw new Error("POCKETBASE_EMAIL is not set");
}

if (!process.env.POCKETBASE_PASSWORD) {
    throw new Error("POCKETBASE_PASSWORD is not set");
}

// Initialize discord.js client
const client: Client = new Client({
    intents: [GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers, GatewayIntentBits.Guilds, GatewayIntentBits.GuildModeration, GatewayIntentBits.DirectMessages, GatewayIntentBits.AutoModerationExecution],
    partials: [Partials.Channel, Partials.Message]
});
await LoadAllModules();

// Load discord.js event handlers
const eventsPath = path.join(import.meta.dir, "events");
const eventFiles = fs.readdirSync(eventsPath).filter((file) => file.endsWith(".ts"));



for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = await import(filePath);
    console.log(`Loaded event handler: ${event.name}`);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

// Start discord.js client
client.login(process.env.DISCORD_TOKEN);
