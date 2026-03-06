export interface ValidationError {
    field: string;
    reason: string;
}
export declare function validateEmail(email: string): ValidationError | null;
export declare function validateIndianPhone(phone: string): ValidationError | null;
export declare function validatePasswordStrength(password: string, minLength?: number): ValidationError | null;
export declare const VALID_BAR_COUNCIL_STATES: string[];
export declare function validateBarNumber(barNumber: string, state: string): ValidationError | null;
export declare function validateMCA21RegistrationNumber(regNo: string): ValidationError | null;
export declare function validateGSTNumber(gst: string): ValidationError | null;
export interface LawyerRegistrationInput {
    email: string;
    password: string;
    name: string;
    phone: string;
    barNumber: string;
    barCouncilState: string;
}
export declare function validateLawyerRegistration(input: LawyerRegistrationInput): ValidationError[];
export interface FirmRegistrationInput {
    email: string;
    password: string;
    name: string;
    firmName: string;
    phone: string;
    registrationNumber: string;
    gstNumber?: string;
    city: string;
    state: string;
}
export declare function validateFirmRegistration(input: FirmRegistrationInput): ValidationError[];
//# sourceMappingURL=validator.d.ts.map