export type OtpUserType = 'lawyer' | 'firm';
export type OtpPurpose = 'LOGIN_2FA' | 'PHONE_VERIFICATION' | 'EMAIL_VERIFICATION' | 'PASSWORD_RESET' | 'SENSITIVE_ACTION';
declare class OtpService {
    generate(userId: string, userType: OtpUserType, purpose: OtpPurpose, ipAddress?: string, userAgent?: string): Promise<string>;
    verify(userId: string, userType: OtpUserType, purpose: OtpPurpose, submittedOtp: string): Promise<void>;
    private generateRawOtp;
    private enforceHourlyLimit;
    private incrementHourlyCount;
    private invalidateExisting;
    private findActiveRecord;
    private incrementAttempts;
    private markUsed;
    private killRecord;
}
export declare const otpService: OtpService;
export default otpService;
//# sourceMappingURL=otp.service.d.ts.map