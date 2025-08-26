export module Events {
    export enum Button {
        VerifyStudent = 'btn-verify-student',
        VerifyAlumni = 'btn-verify-alumni',
        VerifyInstructor = 'btn-verify-instructor',
        ForceVerifyPending = 'btn-force-verify-pending',
        SetPreferredName = 'set-preferred-name',
    };
    
    export enum Modal {
        VerifyStudentModal = 'modal-verify-student',
        VerifyAlumniModal = 'modal-verify-alumni',
        VerifyInstructorModal = 'modal-verify-instructor',
        PreferredNameModal = 'modal-preferred-name'
    };
    
}