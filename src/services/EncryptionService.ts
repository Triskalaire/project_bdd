import * as CryptoJS from 'crypto-js';

export class EncryptionService {
    private static readonly SECRET_KEY = process.env.ENCRYPTION_KEY || 'default-secret-key';

    static encrypt(text: string): string {
        return CryptoJS.AES.encrypt(text, this.SECRET_KEY).toString();
    }

    static decrypt(encryptedText: string): string {
        const bytes = CryptoJS.AES.decrypt(encryptedText, this.SECRET_KEY);
        return bytes.toString(CryptoJS.enc.Utf8);
    }

    static createHash(text: string): string {
        return CryptoJS.SHA256(text).toString();
    }
} 