import crypto from "crypto";
import MVCElement from "./MVCElement.js";
export class ReturnKeys {}
const SymmetricAlgorihm = 'aes-192-cbc';
const iv = Buffer.alloc(16, 0);
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

  static InitExchange() {
    const exchangeObject = crypto.createDiffieHellman(2048);
    const exchangeKey = exchangeObject.generateKeys();
    return {
      exchangeObject,
      exchangeKey
    };
  }

  static InvokeExchange(exchangePrime, exchangeGenerator) {
    const exchangeObject = crypto.createDiffieHellman(exchangePrime, exchangeGenerator);
    const exchangeKey = exchangeObject.generateKeys();
    return {
      exchangeObject,
      exchangeKey
    };
  }

  static CalculateSecret(exchangeObject, key) {
    return exchangeObject.computeSecret(key);
  }

  static SymmetricEncrypt(data, secret) {
    const key = crypto.scryptSync(secret, 'salt', 24);
    let cipher = crypto.createCipheriv(SymmetricAlgorihm, key, iv);
    cipher.setEncoding('hex');
    let encrypted = cipher.update(data);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return encrypted.toString('hex');
  }

  static SymmetricDecrypt(data, secret) {
    const key = crypto.scryptSync(secret, 'salt', 24);
    let encryptedText = Buffer.from(data, 'hex');
    let decipher = crypto.createDecipheriv(SymmetricAlgorihm, key, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  }

  static getMessageID() {
    const val = crypto.randomInt(1000000);
    return val;
  }

}