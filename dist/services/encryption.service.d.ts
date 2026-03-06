declare class EncryptionService {
    private readonly key;
    constructor();
    encrypt(plaintext: string): string;
    decrypt(stored: string): string;
    reEncrypt(stored: string): string;
    isEncrypted(value: string): boolean;
}
export declare const encryptionService: EncryptionService;
export default encryptionService;
//# sourceMappingURL=encryption.service.d.ts.map