export type UserType = 'CITIZEN' | 'LAWYER' | 'FIRM_ADMIN' | 'FIRM_MEMBER';
export interface BaseJwtPayload {
    sub: string;
    userType: UserType;
    iat?: number;
    exp?: number;
}
export interface CitizenJwtPayload extends BaseJwtPayload {
    userType: 'CITIZEN';
}
export interface LawyerJwtPayload extends BaseJwtPayload {
    userType: 'LAWYER';
    twoFactorVerified: boolean;
    verificationStatus: string;
}
export interface FirmJwtPayload extends BaseJwtPayload {
    userType: 'FIRM_ADMIN';
    twoFactorVerified: boolean;
    verificationStatus: string;
}
export interface TwoFaTempPayload {
    sub: string;
    userType: 'LAWYER' | 'FIRM_ADMIN';
    purpose: 'TWO_FA_PENDING';
    iat?: number;
    exp?: number;
}
export declare function generateCitizenTokens(citizenId: string): {
    accessToken: string;
    refreshToken: string;
};
export declare function generateLawyerTokens(lawyerId: string, verificationStatus: string): {
    accessToken: string;
    refreshToken: string;
};
export declare function generateFirmTokens(firmId: string, verificationStatus: string): {
    accessToken: string;
    refreshToken: string;
};
export declare function generateTwoFaTempToken(userId: string, userType: 'LAWYER' | 'FIRM_ADMIN'): string;
export declare function verifyTwoFaTempToken(token: string): TwoFaTempPayload;
export declare function verifyRefreshToken(token: string): BaseJwtPayload;
export declare function verifyAccessToken(token: string): BaseJwtPayload;
//# sourceMappingURL=jwt.utils.d.ts.map