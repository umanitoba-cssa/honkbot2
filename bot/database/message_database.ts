import mysql, { type ConnectionOptions, type Connection } from 'mysql2/promise';
import type { SQLMessage } from '../models/SQLMessage';
import type { SQLCounters } from '../models/SQLCounters';
import { MessageFlags } from 'discord.js';
import type { SQLEditMessage } from '../models/SQLEditMessage';

// Check if MySQL is configured
const isMySQLConfigured = !!(process.env.MYSQL_HOST && process.env.MYSQL_USER && process.env.MYSQL_PASSWORD);

if (!isMySQLConfigured) {
    console.warn('MySQL not configured - message logging will be disabled');
}

// Connection cache for different guild databases
const connectionCache = new Map<string, Connection>();

// Base connection configuration without database specified
const baseAccess: ConnectionOptions = {
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT) : 3306,
    supportBigNumbers: true,
    bigNumberStrings: true
}

// Get or create connection for a specific guild
async function getGuildConnection(guild_id: string): Promise<Connection | null> {
    if (!isMySQLConfigured) {
        return null;
    }
    
    if (!guild_id) {
        throw new Error('Guild ID is required');
    }

    // Check if we already have a cached connection for this guild
    if (connectionCache.has(guild_id)) {
        return connectionCache.get(guild_id)!;
    }

    // Create connection without database first to create database if needed
    const adminConnection = await mysql.createConnection(baseAccess);
    
    // Create database if it doesn't exist
    await adminConnection.execute(`CREATE DATABASE IF NOT EXISTS \`${guild_id}\``);
    await adminConnection.end();

    // Create connection with the guild database
    const guildAccess: ConnectionOptions = {
        ...baseAccess,
        database: guild_id
    };

    const guildConnection = await mysql.createConnection(guildAccess);
    
    // Initialize tables if they don't exist
    await initializeTables(guildConnection);
    
    // Cache the connection
    connectionCache.set(guild_id, guildConnection);
    
    return guildConnection;
}

// Initialize database tables with the schema from your diagram
async function initializeTables(connection: Connection): Promise<void> {
    // Create messages table
    await connection.execute(`
        CREATE TABLE IF NOT EXISTS messages (
            channel_id BIGINT NOT NULL,
            user_id BIGINT NOT NULL,
            content TEXT,
            timestamp DATETIME NOT NULL,
            message_id VARCHAR(64) NOT NULL,
            PRIMARY KEY (message_id),
            INDEX idx_channel_message (channel_id, message_id)
        )
    `);

    // Create message_deleted table
    await connection.execute(`
        CREATE TABLE IF NOT EXISTS message_deleted (
            channel_id BIGINT NOT NULL,
            user_id BIGINT NOT NULL,
            content TEXT,
            timestamp DATETIME NOT NULL,
            message_id VARCHAR(64) NOT NULL,
            PRIMARY KEY (message_id),
            INDEX idx_channel_message_deleted (channel_id, message_id)
        )
    `);

    // Create message_edited table
    await connection.execute(`
        CREATE TABLE IF NOT EXISTS message_edited (
            channel_id BIGINT NOT NULL,
            user_id BIGINT NOT NULL,
            old_content TEXT,
            new_content TEXT,
            timestamp DATETIME NOT NULL,
            message_id VARCHAR(64) NOT NULL,
            edit_number INT NOT NULL,
            PRIMARY KEY (message_id, edit_number),
            INDEX idx_channel_message_edited (channel_id, message_id)
        )
    `);

    // Create counters table
    await connection.execute(`
        CREATE TABLE IF NOT EXISTS counters (
            reactions_sent BIGINT DEFAULT 0,
            reactions_received BIGINT DEFAULT 0,
            message_count BIGINT DEFAULT 0,
            thistbh_sent BIGINT DEFAULT 0,
            thistbh_received BIGINT DEFAULT 0,
            user_id BIGINT NOT NULL,
            PRIMARY KEY (user_id)
        )
    `);
}

// https://discord/channels/server_id/channel_id/message_id/

export async function SQLLogUserMessage(
    guild_id: string | null,
    channel_id: string,
    message_id: string,
    user_id: string,
    content: string,
    timestamp: number) {
    
    if (!isMySQLConfigured || !guild_id) {
        return; // Skip if MySQL not configured or no guild ID
    }

    const date = new Date(timestamp);
    const mysqlDatetime = date.toISOString().slice(0, 19).replace('T', ' ');
    const connection = await getGuildConnection(guild_id);

    if (!connection) {
        return; // Skip if no connection
    }

    await connection.execute(
        'INSERT INTO messages (channel_id, message_id, user_id, content, timestamp) VALUES (?, ?, ?, ?, ?)',
        [channel_id, message_id, user_id, content, mysqlDatetime]
    );
}

export async function SQLGetUserMessage(
    guild_id: string | null,
    channel_id: string,
    message_id: string): Promise<SQLMessage | null> {
    
    if (!guild_id) {
        throw new Error('Guild ID is required');
    }

    try {
        const connection = await getGuildConnection(guild_id);
        if (!connection) {
            return null;
        }
        const [rows] = await connection.query(
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
    
    if (!guild_id) {
        throw new Error('Guild ID is required');
    }

    const date = new Date(timestamp);
    const mysqlDatetime = date.toISOString().slice(0, 19).replace('T', ' ');
    const connection = await getGuildConnection(guild_id);

    if (!connection) {
            return null;
        }
    await connection.execute(
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
    
    if (!guild_id) {
        throw new Error('Guild ID is required');
    }

    const date = new Date(timestamp);
    const mysqlDatetime = date.toISOString().slice(0, 19).replace('T', ' ');
    const connection = await getGuildConnection(guild_id);

    if (!connection) {
            return null;
        }
    const [rows] = await connection.query(
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

    await connection.execute(
        'INSERT INTO message_edited (channel_id, message_id, edit_number, user_id, old_content, new_content, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [channel_id, message_id, edit_id, user_id, old_content_db, new_content, mysqlDatetime]
    );
}

export async function SQLLogUserMessageDelete(
    guild_id: string | null,
    channel_id: string,
    message_id: string,
) {
    if (!guild_id) {
        throw new Error('Guild ID is required');
    }

    const result = await SQLGetUserMessage(guild_id, channel_id, message_id);
    if (result == null) {
        return;
    }
    
    const connection = await getGuildConnection(guild_id);
    if (!connection) {
            return null;
        }
    await connection.execute(
        'INSERT INTO message_deleted (channel_id, message_id, user_id, content, timestamp) VALUES (?, ?, ?, ?, ?)',
        [result.channel_id, result.message_id, result.user_id, result.content, result.timestamp]
    );
    return result;
}

export async function SQLLogUserRecieveReaction(
    guild_id: string | null,
    user_id: string) {
    
    if (!guild_id) {
        throw new Error('Guild ID is required');
    }

    try {
        await SQLGetUserCount(guild_id, user_id);
        const connection = await getGuildConnection(guild_id);

        if (!connection) {
            return null;
        }
        await connection.execute(
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
    
    if (!guild_id) {
        throw new Error('Guild ID is required');
    }

    await SQLGetUserCount(guild_id, user_id);
    const connection = await getGuildConnection(guild_id);

    if (!connection) {
            return null;
        }
    await connection.execute(
        'UPDATE counters SET reactions_sent = reactions_sent + 1 WHERE user_id = ?',
        [user_id]
    );
}

export async function SQLLogUserRemoveRecieveReaction(
    guild_id: string | null,
    user_id: string) {
    
    if (!guild_id) {
        throw new Error('Guild ID is required');
    }

    await SQLGetUserCount(guild_id, user_id);
    const connection = await getGuildConnection(guild_id);

    if (!connection) {
            return null;
        }
    await connection.execute(
        'UPDATE counters SET reactions_received = reactions_received - 1 WHERE user_id = ?',
        [user_id]
    );
}

export async function SQLLogUserRemoveGiveReaction(
    guild_id: string | null,
    user_id: string) {
    
    if (!guild_id) {
        throw new Error('Guild ID is required');
    }

    await SQLGetUserCount(guild_id, user_id);
    const connection = await getGuildConnection(guild_id);

    if (!connection) {
            return null;
        }
    await connection.execute(
        'UPDATE counters SET reactions_sent = reactions_sent - 1 WHERE user_id = ?',
        [user_id]
    );
}

export async function SQLLogUserRecieveThisTBHReaction(
    guild_id: string | null,
    user_id: string) {
    
    if (!guild_id) {
        throw new Error('Guild ID is required');
    }

    await SQLGetUserCount(guild_id, user_id);
    const connection = await getGuildConnection(guild_id);

    if (!connection) {
            return null;
        }
    await connection.execute(
        'UPDATE counters SET thistbh_received = thistbh_received + 1 WHERE user_id = ?',
        [user_id]
    );
}

export async function SQLLogUserGiveThisTBHReaction(
    guild_id: string | null,
    user_id: string) {
    
    if (!guild_id) {
        throw new Error('Guild ID is required');
    }

    await SQLGetUserCount(guild_id, user_id);
    const connection = await getGuildConnection(guild_id);

    if (!connection) {
            return null;
        }
    await connection.execute(
        'UPDATE counters SET thistbh_sent = thistbh_sent + 1 WHERE user_id = ?',
        [user_id]
    );
}

export async function SQLLogUserRemoveRecieveThisTBHReaction(
    guild_id: string | null,
    user_id: string) {
    
    if (!guild_id) {
        throw new Error('Guild ID is required');
    }

    await SQLGetUserCount(guild_id, user_id);
    const connection = await getGuildConnection(guild_id);

    if (!connection) {
            return null;
        }
    await connection.execute(
        'UPDATE counters SET thistbh_received = thistbh_received - 1 WHERE user_id = ?',
        [user_id]
    );
}

export async function SQLLogUserRemoveGiveThisTBHReaction(
    guild_id: string | null,
    user_id: string) {
    
    if (!guild_id) {
        throw new Error('Guild ID is required');
    }

    await SQLGetUserCount(guild_id, user_id);
    const connection = await getGuildConnection(guild_id);

    if (!connection) {
            return null;
        }
    await connection.execute(
        'UPDATE counters SET thistbh_sent = thistbh_sent - 1 WHERE user_id = ?',
        [user_id]
    );
}

export async function SQLLogUserMessageCount(
    guild_id: string | null,
    user_id: string) {
    
    if (!guild_id) {
        throw new Error('Guild ID is required');
    }

    await SQLGetUserCount(guild_id, user_id);
    const connection = await getGuildConnection(guild_id);

    if (!connection) {
            return null;
        }
    await connection.execute(
        'UPDATE counters SET message_count = message_count + 1 WHERE user_id = ?',
        [user_id]
    );
}


export async function SQLGetUserCount(
    guild_id: string | null,
    user_id: string) {
    
    if (!guild_id) {
        throw new Error('Guild ID is required');
    }

    try {
        const connection = await getGuildConnection(guild_id);
        if (!connection) {
            return null;
        }
        const [rows] = await connection.query(
            'SELECT * FROM counters WHERE user_id = ?', [user_id]
        );
        const counters: SQLCounters = (rows as any)[0] as SQLCounters;
        if (counters === undefined) {
            await connection.execute(
                'INSERT INTO counters (user_id, reactions_sent, reactions_received, message_count, thistbh_sent, thistbh_received) VALUES (?, 0, 0, 0, 0, 0)',
                [user_id]
            );
            const [rows] = await connection.query(
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

// Clean up function to close all connections
export async function closeDatabaseConnections(): Promise<void> {
    for (const [guildId, connection] of connectionCache) {
        try {
            await connection.end();
            console.log(`Closed database connection for guild: ${guildId}`);
        } catch (error) {
            console.error(`Error closing connection for guild ${guildId}:`, error);
        }
    }
    connectionCache.clear();
}
