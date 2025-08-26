# Honkbot2

Honkbot2 is the new discord bot for the UManitoba Computer Science Lounge written by @noahc3 and @travisfriesen.

Honkbot2 contains a wide variety of moderation and verification functionalities.
To learn more read the [Moderation Handbook](https://umanitobacssa.ca/docs/discordModHandbook.pdf)

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd honkbot2
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your Discord bot credentials
   ```

3. **Run the setup script**
   ```bash
   docker compose up -d
   ```

4. **Set up the pocketbase admin account**
   go to http://localhost:8080/_/ (or the ip of your remote server) and set up the account with the same credentails as your .env

That's it! The setup script will automatically:
- ✅ Build and start all Docker containers
- ✅ Create MySQL database with proper schema
- ✅ Configure all database connections

## Environment Variables

The following variables need to be set in your `.env` file:

- `DISCORD_CLIENT_ID` - Your Discord application client ID
- `DISCORD_GUILD_ID` - Your Discord server ID
- `DISCORD_TOKEN` - Your Discord bot token
- `POCKETBASE_EMAIL` - Email for PocketBase admin (auto-created)
- `POCKETBASE_PASSWORD` - Password for PocketBase admin (auto-created)
- `BOT_ADMIN` - Your Discord username for admin commands

## Database Configuration

The bot uses two databases that are automatically configured:

### MySQL (Message Database)
- **Host**: `message-db` (container name)
- **Port**: `3306`
- **User**: `test`
- **Password**: `pass`
- **Auto-creates**: Separate database per Discord server using server ID

### PocketBase (Moderation Database)
- **Host**: `moderation-db:8080` (container name)
- **Admin Panel**: http://localhost:8080/_/

## Development Commands

```bash
# Start all services
docker-compose up -d

# View bot logs
docker-compose logs honkbot

# View PocketBase logs
docker-compose logs pocketbase-db

# View MySQL logs
docker-compose logs mysql

# Stop all services
docker-compose down

# Rebuild and restart
docker-compose up --build -d
```

## Database Schema

The MySQL database automatically creates the following tables per Discord server:

- `messages` - Stores all user messages
- `message_deleted` - Stores deleted messages for moderation
- `message_edited` - Stores message edit history
- `counters` - Stores user statistics (reactions, message counts, etc.)
