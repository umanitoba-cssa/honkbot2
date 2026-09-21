import type { Express } from "express";
import { IsUserVerified } from "../database/database";

const guildId = process.env.DISCORD_GUILD_ID;
const API_KEY = process.env.WEB_API_KEY;

export function setupApi(app: Express) {
    app.get("/api/is_user_verified/:id", async (req, res) => {
        if (req.headers.authorization !== `Bearer ${API_KEY}`) {
            res.status(401).send({ message: "Unauthorized" });
            return;
        }
        if (!guildId) {
            res.status(500).send({ message: "DISCORD_GUILD_ID is not defined." });
            return;
        }

        try {
            const id = req.params.id;
            const isVerified = await IsUserVerified(guildId, id);
            res.status(200).send(isVerified);
        } catch (error) {
            console.error(error);
            res.status(500).send({ message: "Failed to check user verification." });
        }
    });
}
