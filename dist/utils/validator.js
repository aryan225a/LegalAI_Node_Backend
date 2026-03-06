export function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(email)) {
        return { field: 'email', reason: 'Invalid email address format.' };
    }
    return null;
}
export function validateIndianPhone(phone) {
    const cleaned = phone.replace(/\s|-/g, '');
    const re = /^[6-9]\d{9}$/;
    if (!re.test(cleaned)) {
        return {
            field: 'phone',
            reason: 'Must be a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.',
        };
    }
    return null;
}
export function validatePasswordStrength(password, minLength = 10) {
    if (password.length < minLength) {
        return { field: 'password', reason: `Password must be at least ${minLength} characters.` };
    }
    if (!/[A-Z]/.test(password)) {
        return { field: 'password', reason: 'Password must contain at least one uppercase letter.' };
    }
    if (!/[0-9]/.test(password)) {
        return { field: 'password', reason: 'Password must contain at least one number.' };
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        return { field: 'password', reason: 'Password must contain at least one special character.' };
    }
    return null;
}
const BAR_NUMBER_PATTERNS = {
    DELHI: { pattern: /^D\/\d{4}\/\d{4,6}$/i, example: 'D/2010/1234' },
    MAHARASHTRA: { pattern: /^MAH\/\d{4}\/\d{4,6}$/i, example: 'MAH/2010/12345' },
    KARNATAKA: { pattern: /^KAR\/\d{4}\/\d{4,6}$/i, example: 'KAR/2010/1234' },
    TAMIL_NADU: { pattern: /^TN\/\d{4}\/\d{4,6}$/i, example: 'TN/2010/1234' },
    KERALA: { pattern: /^KER\/\d{4}\/\d{4,6}$/i, example: 'KER/2010/1234' },
    GUJARAT: { pattern: /^GUJ\/\d{4}\/\d{4,6}$/i, example: 'GUJ/2010/1234' },
    RAJASTHAN: { pattern: /^RAJ\/\d{4}\/\d{4,6}$/i, example: 'RAJ/2010/1234' },
    WEST_BENGAL: { pattern: /^WB\/\d{4}\/\d{4,6}$/i, example: 'WB/2010/1234' },
    ANDHRA_PRADESH: { pattern: /^AP\/\d{4}\/\d{4,6}$/i, example: 'AP/2010/1234' },
    TELANGANA: { pattern: /^TS\/\d{4}\/\d{4,6}$/i, example: 'TS/2010/1234' },
    UTTAR_PRADESH: { pattern: /^UP\/\d{4}\/\d{4,6}$/i, example: 'UP/2010/1234' },
    BIHAR: { pattern: /^BIH\/\d{4}\/\d{4,6}$/i, example: 'BIH/2010/1234' },
    PUNJAB_HARYANA: { pattern: /^PH\/\d{4}\/\d{4,6}$/i, example: 'PH/2010/1234' },
    MADHYA_PRADESH: { pattern: /^MP\/\d{4}\/\d{4,6}$/i, example: 'MP/2010/1234' },
    ODISHA: { pattern: /^ORI\/\d{4}\/\d{4,6}$/i, example: 'ORI/2010/1234' },
    ASSAM: { pattern: /^ASM\/\d{4}\/\d{4,6}$/i, example: 'ASM/2010/1234' },
    GOA: { pattern: /^GOA\/\d{4}\/\d{4,6}$/i, example: 'GOA/2010/1234' },
    HIMACHAL: { pattern: /^HP\/\d{4}\/\d{4,6}$/i, example: 'HP/2010/1234' },
    SUPREME_COURT: { pattern: /^SC\/\d{4}\/\d{4,6}$/i, example: 'SC/2010/1234' },
};
export const VALID_BAR_COUNCIL_STATES = Object.keys(BAR_NUMBER_PATTERNS);
export function validateBarNumber(barNumber, state) {
    const normalizedState = state.toUpperCase().replace(/\s+/g, '_');
    const config = BAR_NUMBER_PATTERNS[normalizedState];
    if (!config) {
        return {
            field: 'barCouncilState',
            reason: `Unrecognised bar council state: ${state}. Valid states: ${VALID_BAR_COUNCIL_STATES.join(', ')}`,
        };
    }
    if (!config.pattern.test(barNumber.trim())) {
        return {
            field: 'barNumber',
            reason: `Invalid bar council enrolment number for ${state}. Expected format: ${config.example}`,
        };
    }
    return null;
}
export function validateMCA21RegistrationNumber(regNo) {
    const pattern = /^[UL]\d{5}[A-Z]{2}\d{4}(PTC|PLC|LLP|OPC|NPL|GAP)\d{6}$/;
    if (!pattern.test(regNo.trim().toUpperCase())) {
        return {
            field: 'registrationNumber',
            reason: 'Invalid MCA21 company registration number. Example format: U74999DL2020PTC123456',
        };
    }
    return null;
}
export function validateGSTNumber(gst) {
    const pattern = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}Z[A-Z\d]{1}$/;
    if (!pattern.test(gst.trim().toUpperCase())) {
        return {
            field: 'gstNumber',
            reason: 'Invalid GST number format. Example: 07AABCU9603R1ZV',
        };
    }
    return null;
}
export function validateLawyerRegistration(input) {
    const errors = [];
    const emailErr = validateEmail(input.email);
    if (emailErr)
        errors.push(emailErr);
    const passwordErr = validatePasswordStrength(input.password, 10);
    if (passwordErr)
        errors.push(passwordErr);
    if (!input.name || input.name.trim().length < 2) {
        errors.push({ field: 'name', reason: 'Full name is required (min 2 characters).' });
    }
    const phoneErr = validateIndianPhone(input.phone);
    if (phoneErr)
        errors.push(phoneErr);
    const barErr = validateBarNumber(input.barNumber, input.barCouncilState);
    if (barErr)
        errors.push(barErr);
    return errors;
}
export function validateFirmRegistration(input) {
    const errors = [];
    const emailErr = validateEmail(input.email);
    if (emailErr)
        errors.push(emailErr);
    const passwordErr = validatePasswordStrength(input.password, 12);
    if (passwordErr)
        errors.push(passwordErr);
    if (!input.firmName || input.firmName.trim().length < 2) {
        errors.push({ field: 'firmName', reason: 'Firm name is required (min 2 characters).' });
    }
    if (!input.name || input.name.trim().length < 2) {
        errors.push({ field: 'name', reason: 'Admin contact name is required.' });
    }
    const phoneErr = validateIndianPhone(input.phone);
    if (phoneErr)
        errors.push(phoneErr);
    const regErr = validateMCA21RegistrationNumber(input.registrationNumber);
    if (regErr)
        errors.push(regErr);
    if (input.gstNumber) {
        const gstErr = validateGSTNumber(input.gstNumber);
        if (gstErr)
            errors.push(gstErr);
    }
    if (!input.city?.trim()) {
        errors.push({ field: 'city', reason: 'City is required.' });
    }
    if (!input.state?.trim()) {
        errors.push({ field: 'state', reason: 'State is required.' });
    }
    return errors;
}
//# sourceMappingURL=validator.js.map