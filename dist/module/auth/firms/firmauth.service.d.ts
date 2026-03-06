declare class FirmAuthService {
    register(input: {
        email: string;
        password: string;
        name: string;
        firmName: string;
        phone: string;
        registrationNumber: string;
        gstNumber?: string;
        city: string;
        state: string;
        address?: string;
    }): Promise<{
        firm: {
            id: string;
            email: string;
            name: string;
            verificationStatus: import("@prisma/client").$Enums.VerificationStatus;
            firmName: string;
            city: string;
            state: string;
        };
        verificationStatus: string;
        validationErrors: import("../../../utils/validator.js").ValidationError[] | undefined;
        message: string;
    }>;
    verifyEmail(firmId: string, otp: string): Promise<{
        id: string;
        email: string;
        verificationStatus: import("@prisma/client").$Enums.VerificationStatus;
        firmName: string;
    }>;
    loginStep1(email: string, password: string, ipAddress?: string): Promise<{
        requiresTwoFactor: boolean;
        twoFactorToken: string;
        isNewIp: boolean | "" | undefined;
        message: string;
    }>;
    loginStep2(twoFactorToken: string, otp: string, ipAddress?: string): Promise<{
        firm: {
            id: string;
            email: string;
            name: string;
            firmName: string;
            userType: string;
            verificationStatus: import("@prisma/client").$Enums.VerificationStatus;
            city: string;
            state: string;
        };
        accessToken: string;
        refreshToken: string;
    }>;
    refreshTokens(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(firmId: string, refreshToken: string): Promise<void>;
    requestPasswordReset(email: string): Promise<{
        message: string;
    }>;
    resetPassword(email: string, otp: string, newPassword: string): Promise<{
        message: string;
    }>;
    private handleFailedLogin;
    private storeRefreshToken;
}
export declare const firmAuthService: FirmAuthService;
export default firmAuthService;
//# sourceMappingURL=firmauth.service.d.ts.map