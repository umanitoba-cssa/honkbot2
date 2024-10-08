interface VerifiedUserBase {
    id: string
    guild_id: string
    user_id: string
    name: string
    email: string
}

export interface VerifiedStudent extends VerifiedUserBase {
    type: "student"
    program: string
    year: number
    student_id: string
}

export interface VerifiedAlumni extends VerifiedUserBase {
    type: "alumni"
    program: string
    alumni_year_graduated: number
}

export interface VerifiedInstructor extends VerifiedUserBase {
    type: "instructor"
    instructor_courses_taught: string
    instructor_courses_enrolled: string
}

export interface VerifiedGuest extends VerifiedUserBase {
    type: "guest"
}

export type VerifiedUser = VerifiedStudent | VerifiedAlumni | VerifiedInstructor | VerifiedGuest
export type PendingVerification = VerifiedUser & {
    expires: Date
}