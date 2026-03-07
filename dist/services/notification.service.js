import { Resend } from 'resend';
import { logger } from '../utils/logger.js';
const PURPOSE_LABELS = {
    LOGIN_2FA: 'Login Verification',
    PHONE_VERIFICATION: 'Phone Number Verification',
    EMAIL_VERIFICATION: 'Email Verification',
    PASSWORD_RESET: 'Password Reset',
    SENSITIVE_ACTION: 'Security Verification',
};
class NotificationService {
    resend;
    fromAddress;
    constructor() {
        if (!process.env.RESEND_API_KEY) {
            throw new Error('RESEND_API_KEY environment variable is not set.');
        }
        this.resend = new Resend(process.env.RESEND_API_KEY);
        this.fromAddress = process.env.SMTP_FROM
            || (process.env.NODE_ENV === 'production'
                ? 'Nyay Mitra <noreply@contact.legalai.software>'
                : 'Nyay Mitra <onboarding@resend.dev>');
    }
    async sendOtpEmail(payload) {
        if (process.env.NODE_ENV === 'development') {
            logger.info('[DEV] Email skipped — read OTP from terminal logs above');
            return;
        }
        const { to, otp, purpose, recipientName } = payload;
        const label = PURPOSE_LABELS[purpose];
        const html = `
      <!DOCTYPE html>
      <html>
      <body style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#222;">
        <div style="border-bottom:3px solid #1a3c5e;padding-bottom:16px;margin-bottom:24px;">
          <h2 style="margin:0;color:#1a3c5e;">⚖️ Nyay Mitra</h2>
        </div>
        <p>Hello ${recipientName},</p>
        <p>Your one-time verification code for <strong>${label}</strong> is:</p>
        <div style="background:#f4f6f9;border-radius:8px;padding:24px;text-align:center;margin:24px 0;">
          <span style="font-size:36px;font-weight:bold;letter-spacing:10px;color:#1a3c5e;">
            ${otp}
          </span>
        </div>
        <p style="color:#555;font-size:14px;">
          Valid for <strong>10 minutes</strong>. Maximum 3 attempts.
        </p>
        <p style="color:#555;font-size:14px;">
          If you did not request this, ignore this email — your account is safe.
        </p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
        <p style="color:#999;font-size:12px;">
          Automated message from Nyay Mitra. Do not reply.
        </p>
      </body>
      </html>
    `;
        try {
            const { error } = await this.resend.emails.send({
                from: this.fromAddress,
                to,
                subject: `${otp} — Your Nyay Mitra ${label} Code`,
                html,
                text: `Your Nyay Mitra ${label} code: ${otp}\nValid 10 minutes. Do not share.`,
            });
            if (error) {
                logger.error('Resend delivery error', { to, purpose, error });
                return;
            }
            logger.info('OTP email sent', { to, purpose });
        }
        catch (error) {
            logger.error('Resend SDK error', { to, purpose, error });
        }
    }
    async sendWelcomeEmail(to, name, userType) {
        const typeLabel = userType === 'lawyer' ? 'Advocate' : 'Law Firm';
        try {
            await this.resend.emails.send({
                from: this.fromAddress,
                to,
                subject: 'Welcome to Nyay Mitra — Your Account is Verified',
                html: `
          <body style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
            <h2 style="color:#1a3c5e;">⚖️ Welcome to Nyay Mitra, ${name}</h2>
            <p>Your <strong>${typeLabel}</strong> account has been verified and is now active.</p>
            <p>You can now log in and access your workspace.</p>
          </body>
        `,
                text: `Welcome to Nyay Mitra, ${name}. Your ${typeLabel} account is now active.`,
            });
            logger.info('Welcome email sent', { to, userType });
        }
        catch (error) {
            logger.error('Welcome email failed', { to, error });
        }
    }
}
export const notificationService = new NotificationService();
export default notificationService;
//# sourceMappingURL=notification.service.js.map