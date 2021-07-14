import crypto from "crypto";
export class ReturnKeys {}
export default class CryptoUtil {
  static GenerateKeys() {
    const {
      publicKey,
      privateKey
    } = crypto.generateKeyPairSync("rsa", {
      // The standard secure default length for RSA keys is 2048 bits
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      modulusLength: 4096
    });
    let keys = new ReturnKeys();
    keys.isValid = true;
    keys.publicKey = publicKey;
    keys.privateKey = privateKey;
    return keys;
  }

  static GenerateSignature(dataString, privateKey) {
    const signature = crypto.sign("sha256", Buffer.from(dataString), {
      key: privateKey
    });
    return signature;
  }

  static ValidateSignature(dataString, signedDataString, publicKey) {
    const isVerified = crypto.verify("sha256", Buffer.from(dataString), {
      key: publicKey
    }, signedDataString);
    return isVerified;
  }

}