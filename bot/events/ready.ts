import { Client, Events } from 'discord.js'

export const name: Events = Events.ClientReady
export const once = true

export const execute = async (client: Client) => {
    if (!client.user) {
        throw new Error('Client user not found')
    }

    console.log(`Ready! Logged in as ${client.user.tag}`)
}