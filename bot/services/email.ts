import { GetGuildSettings } from "../database/database";
import type { SendVerificationEmailRequest } from "../models/SendVerificationEmailRequest";

export async function SendVerificationEmail(guild_id: string, email: string, verificationCode: string): Promise<string | null> {
    const guild_settings = await GetGuildSettings(guild_id);
    if (!guild_settings) {
        throw new Error(`Guild settings not found for guild_id ${guild_id}`);
    }

    const verification_email_endpoint = guild_settings.verification_email_endpoint;
    if (!verification_email_endpoint) {
        throw new Error(`Verification email endpoint not set for guild_id ${guild_id}`);
    }

    const emailRequest: SendVerificationEmailRequest = {
        email,
        code: `<code>${verificationCode}</code>`
    };

    const response = await fetch(verification_email_endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailRequest)
    });

    if (!response.ok) {
        throw new Error(`Failed to send verification email: ${response.statusText}`);
    }

    if (response.status === 204) {
        return null;
    } else {
        const responseJson: any = await response.json();
        return responseJson.name;
    }
}