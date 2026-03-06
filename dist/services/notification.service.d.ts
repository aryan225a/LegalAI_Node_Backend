export type OtpPurpose = 'LOGIN_2FA' | 'PHONE_VERIFICATION' | 'EMAIL_VERIFICATION' | 'PASSWORD_RESET' | 'SENSITIVE_ACTION';
interface OtpEmailPayload {
    to: string;
    otp: string;
    purpose: OtpPurpose;
    recipientName: string;
}
declare class NotificationService {
    private resend;
    private fromAddress;
    constructor();
    sendOtpEmail(payload: OtpEmailPayload): Promise<void>;
    sendWelcomeEmail(to: string, name: string, userType: 'lawyer' | 'firm'): Promise<void>;
}
export declare const notificationService: NotificationService;
export default notificationService;
//# sourceMappingURL=notification.service.d.ts.map