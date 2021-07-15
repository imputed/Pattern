import crypto from "crypto";

export class ReturnKeys {
    privateKey: string
    publicKey: string
    isValid: boolean
}

export default class CryptoUtil {

    static GetEncryptionOption(key): Object {
        return {
            key: key,
            oaepHash: "sha256"
        };
    }

    static GetKeyGenerationOptions(): Object {
        return ({
                publicKeyEncoding: {
                    type: 'spki',
                    format: 'pem'
                },
                modulusLength: 4096
            }
        )
    }


    static GenerateKeys(): ReturnKeys {
        const {publicKey, privateKey} = crypto.generateKeyPairSync("rsa", CryptoUtil.GetKeyGenerationOptions())
        let keys = new ReturnKeys()
        keys.isValid = true
        keys.publicKey = publicKey;
        keys.privateKey = privateKey;
        return keys
    }

    static GenerateSignature(dataString: string, privateKey: string): string {
        return crypto.sign("sha256", Buffer.from(dataString), CryptoUtil.GetEncryptionOption(privateKey))
    }

    static ValidateSignature(dataString: string, signedDataString: string, publicKey: string): boolean {
        return crypto.verify("sha256", Buffer.from(dataString), CryptoUtil.GetEncryptionOption(publicKey), signedDataString)
    }

    static Encrypt(data: string, publicKey: string): string {
        return crypto.publicEncrypt(CryptoUtil.GetEncryptionOption(publicKey), Buffer.from(data))
    }

    static Decrypt(encryptedData: string, privateKey: string): string {
        return crypto.privateDecrypt(CryptoUtil.GetEncryptionOption(privateKey), encryptedData)
    }
}