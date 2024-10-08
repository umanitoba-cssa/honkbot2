import PocketBase from "pocketbase";
import type GuildSettings from "../models/GuildSettings";
import type RollID from "../models/RoleID";
import type { PendingVerification, VerifiedStudent, VerifiedAlumni, VerifiedUser } from "../models/VerifiedUser";
import type { Warning } from "../models/Warning";
import type { Ban } from "../models/Ban";
import type { Kick } from "../models/Kick";
import type { Timeout } from "../models/Timeout";
import type { Modnote } from "../models/Modnote";
import type { ModMail } from "../models/ModMail";

let _pb: PocketBase | null = null;

const getPb = async (): Promise<PocketBase> => {
    if (!_pb) {
        if (!process.env.POCKETBASE_HOST) {
            throw new Error("POCKETBASE_HOST is not set");
        }

        if (!process.env.POCKETBASE_EMAIL) {
            throw new Error("POCKETBASE_EMAIL is not set");
        }

        if (!process.env.POCKETBASE_PASSWORD) {
            throw new Error("POCKETBASE_PASSWORD is not set");
        }

        _pb = new PocketBase(process.env.POCKETBASE_HOST);
        await _pb.admins.authWithPassword(process.env.POCKETBASE_EMAIL, process.env.POCKETBASE_PASSWORD);
        await _pb.autoCancellation(false);
    }

    return _pb;
};

export async function GetGuildSettings(guild_id: string): Promise<GuildSettings | null> {
    const pb = await getPb();
    const guild_settings: GuildSettings | null = await pb
        .collection("guild_settings")
        .getFirstListItem(pb.filter(`guild_id = "${guild_id}"`));

    return guild_settings ?? null;
}

// export async function GetRoleIDs(guild_id: string): Promise<GuildSettings | null> {
//     const pb = await getPb();
//     const role_ids: RollID | null = await pb
//         .collection("role_ids")
//         .getFirstListItem(pb.filter(`guild_id = "${guild_id}"`));

//     return role_ids ?? null;
// }

export async function CreatePendingStudentVerification(
    guild_id: string,
    user_id: string,
    name: string,
    email: string,
    student_id: string,
    program: string,
    year: number
): Promise<PendingVerification> {
    const pb = await getPb();
    const pendingVerification: PendingVerification = {
        id: "",
        guild_id,
        user_id,
        name,
        email,
        student_id,
        type: "student",
        program,
        year,
        expires: new Date(Date.now() + 1000 * 60 * 60) // 1 hour
    };

    const record: PendingVerification = await pb
        .collection("pending_verifications")
        .create(pendingVerification);

    return record;
}

export async function CreatePendingAlumniVerification(
    guild_id: string,
    user_id: string,
    name: string,
    email: string,
    program: string,
    alumni_year_graduated: number
): Promise<PendingVerification> {
    const pb = await getPb();
    const pendingVerification: PendingVerification = {
        id: "",
        guild_id,
        user_id,
        name,
        email,
        type: "alumni",
        program,
        alumni_year_graduated,
        expires: new Date(Date.now() + 1000 * 60 * 60) // 1 hour
    };

    const record: PendingVerification = await pb
        .collection("pending_verifications")
        .create(pendingVerification);

    return record;
}

export async function GetPendingVerification(id: string): Promise<PendingVerification | null> {
    const pb = await getPb();
    let pendingVerification: PendingVerification | null = null;

    try {
        pendingVerification = await pb
            .collection("pending_verifications")
            .getOne(id);
    } catch (error) {
        console.warn(`Failed to fetch from pending_verifications: ${error}`);
        try {
            pendingVerification = await pb
                .collection("pending_alumni_verifications")
                .getOne(id);
        } catch (alumniError) {
            console.error(`Failed to fetch from pending_alumni_verifications: ${alumniError}`);
        }
    }

    return pendingVerification ?? null;
}

export async function GetPendingAlumniVerification(id: string): Promise<PendingVerification | null> {
    const pb = await getPb();
    const pendingVerification: PendingVerification | null = await pb
        .collection("pending_alumni_verifications")
        .getOne(id);

    return pendingVerification ?? null;
}

export async function UpdatePendingVerification(pendingVerification: PendingVerification): Promise<void> {
    const pb = await getPb();
    await pb.collection("pending_verifications").update(pendingVerification.id, pendingVerification);
}

export async function PatchPendingVerification(id: string, patch: Partial<PendingVerification>): Promise<void> {
    const pb = await getPb();
    const obj = await pb.collection("pending_verifications").getOne(id);
    if (!obj) {
        throw new Error(`Pending verification not found with id ${id}`);
    }

    const updatedObj = { ...obj, ...patch };

    await pb.collection("pending_verifications").update(id, updatedObj);
}

export async function VerifyUserDB(pending: PendingVerification) {
    const pb = await getPb();
    const verifiedStudent: VerifiedStudent = pending as VerifiedStudent;

    const existingVerifications = await pb
        .collection("verified_users")
        .getFullList({ filter: `user_id = "${pending.user_id}" && guild_id = "${pending.guild_id}"` });

    for (const verification of existingVerifications) {
        await pb.collection("verified_users").delete(verification.id);
    }

    await pb.collection("verified_users").create(verifiedStudent);
    await pb.collection("pending_verifications").delete(pending.id);
}

export async function VerifyAlumniUserDB(pending: PendingVerification) {
    const pb = await getPb();
    const verifiedStudent: VerifiedStudent = pending as VerifiedStudent;

    const existingVerifications = await pb
        .collection("pending_alumni_verifications")
        .getFullList({ filter: `user_id = "${pending.user_id}" && guild_id = "${pending.guild_id}"` });

    for (const verification of existingVerifications) {
        await pb.collection("pending_alumni_verifications").delete(verification.id);
    }

    await pb.collection("pending_alumni_verifications").create(verifiedStudent);
    await pb.collection("pending_verifications").delete(pending.id);
}

export async function VerifyAlumniUserAsModDB(pending: PendingVerification) {
    const pb = await getPb();
    const verifiedStudent: VerifiedStudent = pending as VerifiedStudent;

    const existingVerifications = await pb
        .collection("verified_users")
        .getFullList({ filter: `user_id = "${pending.user_id}" && guild_id = "${pending.guild_id}"` });

    for (const verification of existingVerifications) {
        await pb.collection("verified_users").delete(verification.id);
    }

    await pb.collection("verified_users").create(verifiedStudent);
    await pb.collection("pending_alumni_verifications").delete(pending.id);
}

export async function GetVerifiedUser(guild_id: string, user_id: string): Promise<VerifiedUser | null> {
    const pb = await getPb();
    try {
        const verifiedUser: VerifiedUser | null = await pb
            .collection("verified_users")
            .getFirstListItem(pb.filter(`user_id = "${user_id}" && guild_id = "${guild_id}"`));
        
        return verifiedUser ?? null;
    } catch (error) {
        console.error("Error fetching verified user:", error);
        return null;
    }
}

export async function AddUserWarning(guild_id: string, target_user_id: string, issuer_user_id: string, reason: string, strike: boolean): Promise<Warning> {
    const pb = await getPb();
    const data = {
        guild_id,
        target_user_id,
        issuer_user_id,
        reason,
        strike
    }
    return await pb.collection("warnings").create(data);
}

export async function GetModnotes(guild_id: string, target_user_id: string): Promise<Modnote[]> {
    const pb = await getPb();
    const modnotes: Modnote[] = await pb
        .collection("mod_notes")
        .getFullList({ filter: `guild_id = "${guild_id}" && target_user_id = "${target_user_id}"` });

    return modnotes;
}

export async function GetModModnotes(guild_id: string, issuer_user_id: string): Promise<Modnote[]> {
    const pb = await getPb();
    const modnotes: Modnote[] = await pb
        .collection("mod_notes")
        .getFullList({ filter: `guild_id = "${guild_id}" && issuer_user_id = "${issuer_user_id}"` });

    return modnotes;
}

export async function GetWarnings(guild_id: string, target_user_id: string): Promise<Warning[]> {
    const pb = await getPb();
    const warnings: Warning[] = await pb
        .collection("warnings")
        .getFullList({ filter: `guild_id = "${guild_id}" && target_user_id = "${target_user_id}"` });

    return warnings;
}

export async function GetModWarnings(guild_id: string, issuer_user_id: string): Promise<Warning[]> {
    const pb = await getPb();
    const warnings: Warning[] = await pb
        .collection("warnings")
        .getFullList({ filter: `guild_id = "${guild_id}" && issuer_user_id = "${issuer_user_id}"` });

    return warnings;
}

export async function GetBans(guild_id: string, target_user_id: string): Promise<Ban[]> {
    const pb = await getPb();
    const bans: Ban[] = await pb
        .collection("bans")
        .getFullList({ filter: `guild_id = "${guild_id}" && target_user_id = "${target_user_id}"` });

    return bans;
}

export async function GetModBans(guild_id: string, issuer_user_id: string): Promise<Ban[]> {
    const pb = await getPb();
    const bans: Ban[] = await pb
        .collection("bans")
        .getFullList({ filter: `guild_id = "${guild_id}" && issuer_user_id = "${issuer_user_id}"` });

    return bans;
}

export async function GetStrikeCount(guild_id: string, target_user_id: string): Promise<number> {
    const pb = await getPb();
    
    const warnings: Warning[] = await pb
        .collection("warnings")
        .getFullList({ filter: `guild_id = "${guild_id}" && target_user_id = "${target_user_id}" && strike = true` });

    return warnings.length;
}

export async function AddUserBan(guild_id: string, target_user_id: string, issuer_user_id: string, reason: string, automatic: boolean): Promise<Ban> {
    const pb = await getPb();
    const data = {
        guild_id,
        target_user_id,
        issuer_user_id,
        reason,
        automatic
    }
    return await pb.collection("bans").create(data);
}

export async function AddUserKick(guild_id: string, target_user_id: string, issuer_user_id: string, reason: string, automatic: boolean): Promise<Kick> {
    const pb = await getPb();
    const data = {
        guild_id,
        target_user_id,
        issuer_user_id,
        reason,
        automatic
    }
    return await pb.collection("kicks").create(data);
}

export async function AddUserTimeout(guild_id: string, target_user_id: string, issuer_user_id: string, duration: number, reason: string, automatic: boolean): Promise<Timeout> {
    const pb = await getPb();
    const data = {
        guild_id,
        target_user_id,
        issuer_user_id,
        duration,
        reason,
        automatic
    }
    return await pb.collection("timeouts").create(data);
}

export async function AddModnote(guild_id: string, target_user_id: string, issuer_user_id: string, content: string): Promise<Modnote> {
    const pb = await getPb();
    const data = {
        guild_id,
        target_user_id,
        issuer_user_id,
        content
    }
    return await pb.collection("mod_notes").create(data);
}

export async function AddModMail(guild_id: string, target_user_id: string, issuer_user_id: string, content: string, incoming: boolean): Promise<ModMail> {
    const pb = await getPb();
    const data = {
        guild_id,
        target_user_id,
        issuer_user_id,
        content,
        incoming
    }
    return await pb.collection("mod_mail").create(data);
}