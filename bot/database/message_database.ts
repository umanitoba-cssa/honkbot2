import mysql, { type ConnectionOptions } from 'mysql2/promise';
import type { SQLMessage } from '../models/SQLMessage';
import type { SQLCounters } from '../models/SQLCounters';
import { MessageFlags } from 'discord.js';
import type { SQLEditMessage } from '../models/SQLEditMessage';

const access: ConnectionOptions = {
    user: process.env.MYSQL_USER,
    // database: process.env.DISCORD_GUILD_ID,
    database: "724363919035990106",
    password: process.env.MYSQL_PASSWORD,
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT) : 33060,
    supportBigNumbers: true,
    bigNumberStrings: true
}

const db = mysql.createConnection(access);

// https://discord/channels/server_id/channel_id/message_id/

export async function SQLLogUserMessage(
    guild_id: string | null,
    channel_id: string,
    message_id: string,
    user_id: string,
    content: string,
    timestamp: number) {
    const date = new Date(timestamp);
    const mysqlDatetime = date.toISOString().slice(0, 19).replace('T', ' ');

    (await db).execute(
        'INSERT INTO messages (channel_id, message_id, user_id, content, timestamp) VALUES (?, ?, ?, ?, ?)',
        [channel_id, message_id, user_id, content, mysqlDatetime]
    )
}

export async function SQLGetUserMessage(
    guild_id: string | null,
    channel_id: string,
    message_id: string): Promise<SQLMessage | null> {
    try {
        const [rows] = await (await db).query(
            'SELECT * FROM messages WHERE channel_id = ? AND message_id = ?', [channel_id, message_id]
        );
        if ([rows].length === 0) {
            return null;
        }
        const message: SQLMessage = (rows as any)[0] as SQLMessage;
        return message;
    } catch (error) {
        console.error('Error fetching message:', error);
        return null;
    }
}

export async function SQLLogUserMessageEdit(
    guild_id: string | null,
    channel_id: string,
    message_id: string,
    user_id: string,
    content: string,
    timestamp: number) {
    const date = new Date(timestamp);
    const mysqlDatetime = date.toISOString().slice(0, 19).replace('T', ' ');

    (await db).execute(
        'UPDATE messages SET content = ?, timestamp = ? WHERE message_id = ?',
        [content, mysqlDatetime, message_id]
    );
}

export async function SQLLogUserOriginalMessageEdit(
    guild_id: string | null,
    channel_id: string,
    message_id: string,
    user_id: string,
    old_content: string,
    new_content: string,
    timestamp: number) {
    const date = new Date(timestamp);
    const mysqlDatetime = date.toISOString().slice(0, 19).replace('T', ' ');

    const [rows] = await (await db).query(
        'SELECT * FROM message_edited WHERE channel_id = ? AND message_id = ? ORDER BY edit_number DESC LIMIT 1', 
        [channel_id, message_id]
    );
    
    let old_content_db = old_content
    let edit_id = 0;
    if ([rows].length > 0) {
        const editedmessage: SQLEditMessage = (rows as any)[0] as SQLEditMessage;
        if (editedmessage && typeof editedmessage.edit_number === 'number') {
            edit_id = editedmessage.edit_number + 1;
            old_content_db = editedmessage.new_content;
        }
    }

    (await db).execute(
        'INSERT INTO message_edited (channel_id, message_id, edit_number, user_id, old_content, new_content, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [channel_id, message_id, edit_id, user_id, old_content_db, new_content, mysqlDatetime]
    );
}

export async function SQLLogUserMessageDelete(
    guild_id: string | null,
    channel_id: string,
    message_id: string,
) {

    const result = await SQLGetUserMessage(guild_id, channel_id, message_id);
    if (result == null) {
        return;
    }
    (await db).execute(
        'INSERT INTO message_deleted (channel_id, message_id, user_id, content, timestamp) VALUES (?, ?, ?, ?, ?)',
        [result.channel_id, result.message_id, result.user_id, result.content, result.timestamp]
    )
    return result;
}

export async function SQLLogUserRecieveReaction(
    guild_id: string | null,
    user_id: string) {
    try {
        await SQLGetUserCount(guild_id, user_id);

        (await db).execute(
            'UPDATE counters SET reactions_received = reactions_received + 1 WHERE user_id = ?',
            [user_id]
        );
    } catch (error) {
        console.error('Error logging reaction received:', error);
    }
}

export async function SQLLogUserGiveReaction(
    guild_id: string | null,
    user_id: string) {

        await SQLGetUserCount(guild_id, user_id);

    (await db).execute(
        'UPDATE counters SET reactions_sent = reactions_sent + 1 WHERE user_id = ?',
        [user_id]
    )
}

export async function SQLLogUserRemoveRecieveReaction(
    guild_id: string | null,
    user_id: string) {

        await SQLGetUserCount(guild_id, user_id);

    (await db).execute(
        'UPDATE counters SET reactions_received = reactions_received - 1 WHERE user_id = ?',
        [user_id]
    )
}

export async function SQLLogUserRemoveGiveReaction(
    guild_id: string | null,
    user_id: string) {

        await SQLGetUserCount(guild_id, user_id);

    (await db).execute(
        'UPDATE counters SET reactions_sent = reactions_sent - 1 WHERE user_id = ?',
        [user_id]
    )
}

export async function SQLLogUserRecieveThisTBHReaction(
    guild_id: string | null,
    user_id: string) {

        await SQLGetUserCount(guild_id, user_id);

    (await db).execute(
        'UPDATE counters SET thistbh_received = thistbh_received + 1 WHERE user_id = ?',
        [user_id]
    )
}

export async function SQLLogUserGiveThisTBHReaction(
    guild_id: string | null,
    user_id: string) {

        await SQLGetUserCount(guild_id, user_id);

    (await db).execute(
        'UPDATE counters SET thistbh_sent = thistbh_sent + 1 WHERE user_id = ?',
        [user_id]
    )
}

export async function SQLLogUserRemoveRecieveThisTBHReaction(
    guild_id: string | null,
    user_id: string) {

        await SQLGetUserCount(guild_id, user_id);

    (await db).execute(
        'UPDATE counters SET thistbh_received = thistbh_received - 1 WHERE user_id = ?',
        [user_id]
    )
}

export async function SQLLogUserRemoveGiveThisTBHReaction(
    guild_id: string | null,
    user_id: string) {

        await SQLGetUserCount(guild_id, user_id);

    (await db).execute(
        'UPDATE counters SET thistbh_sent = thistbh_sent - 1 WHERE user_id = ?',
        [user_id]
    )
}

export async function SQLLogUserMessageCount(
    guild_id: string | null,
    user_id: string) {

        await SQLGetUserCount(guild_id, user_id);

    (await db).execute(
        'UPDATE counters SET message_count = message_count + 1 WHERE user_id = ?',
        [user_id]
    )
}


export async function SQLGetUserCount(
    guild_id: string | null,
    user_id: string) {
    try {
        const [rows] = await (await db).query(
            'SELECT * FROM counters WHERE user_id = ?', [user_id]
        );
        const counters: SQLCounters = (rows as any)[0] as SQLCounters;
        if (counters === undefined) {
            (await db).execute(
                'INSERT INTO counters (user_id, reactions_sent, reactions_received, message_count, thistbh_sent, thistbh_received) VALUES (?, 0, 0, 0, 0, 0)',
                [user_id]
            )
            const [rows] = await (await db).query(
                'SELECT * FROM counters WHERE user_id = ?', [user_id]
            );
            const counters: SQLCounters = (rows as any)[0] as SQLCounters;
            return counters;
        }
        return counters;
    } catch (error) {
        console.error('Error fetching sql counter:', error);
    }
}
