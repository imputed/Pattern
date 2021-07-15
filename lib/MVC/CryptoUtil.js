import crypto from "crypto";
export class ReturnKeys {}
export default class CryptoUtil {
  static GetEncryptionOption(key) {
    return {
      key: key,
      oaepHash: "sha256"
    };
  }

  static GetKeyGenerationOptions() {
    return {
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      modulusLength: 4096
    };
  }

  static GenerateKeys() {
    const {
      publicKey,
      privateKey
    } = crypto.generateKeyPairSync("rsa", CryptoUtil.GetKeyGenerationOptions());
    let keys = new ReturnKeys();
    keys.isValid = true;
    keys.publicKey = publicKey;
    keys.privateKey = privateKey;
    return keys;
  }

  static GenerateSignature(dataString, privateKey) {
    return crypto.sign("sha256", Buffer.from(dataString), CryptoUtil.GetEncryptionOption(privateKey));
  }

  static ValidateSignature(dataString, signedDataString, publicKey) {
    return crypto.verify("sha256", Buffer.from(dataString), CryptoUtil.GetEncryptionOption(publicKey), signedDataString);
  }

  static Encrypt(data, publicKey) {
    return crypto.publicEncrypt(CryptoUtil.GetEncryptionOption(publicKey), Buffer.from(data));
  }

  static Decrypt(encryptedData, privateKey) {
    return crypto.privateDecrypt(CryptoUtil.GetEncryptionOption(privateKey), encryptedData);
  }

}