import CryptoUtil from "../MVC/CryptoUtil";
import crypto from "crypto";
test("Private/Public Key Encryption", () => {
  const {
    privateKey,
    publicKey
  } = CryptoUtil.GenerateKeys();
  const message = "Test the encryption and decryption";
  const encrypt = CryptoUtil.Encrypt(message, publicKey);
  const decrypt = CryptoUtil.Decrypt(encrypt, privateKey);
  expect(decrypt.toString()).toStrictEqual(message);
});
test("Signature - Positiv", () => {
  const {
    privateKey,
    publicKey
  } = CryptoUtil.GenerateKeys();
  const message = "Test the signature";
  const signature = CryptoUtil.GenerateSignature(message, privateKey);
  const checkedSignature = CryptoUtil.ValidateSignature(message, signature, publicKey);
  expect(checkedSignature).toStrictEqual(true);
});
test("Signature - Negativ", () => {
  const {
    privateKey,
    publicKey
  } = CryptoUtil.GenerateKeys();
  const fake = CryptoUtil.GenerateKeys();  const message = "Test the signature";
  const signature = CryptoUtil.GenerateSignature(message, fake.privateKey);
  const checkedSignature = CryptoUtil.ValidateSignature(message, signature, publicKey);
  expect(checkedSignature).toStrictEqual(false);
});
test("Hashing - Positive", () => {
  const message = "Test the hash - Positive Case";
  const hash1 = CryptoUtil.HashContent(message);
  const hash2 = CryptoUtil.HashContent(message);
  expect(hash1).toStrictEqual(hash2);
});
test("Hashing - Negative", () => {
  const message1 = "Test the hash - Negative Case";
  const message2 = "Test the hash - Negative Case.";
  const hash1 = CryptoUtil.HashContent(message1);
  const hash2 = CryptoUtil.HashContent(message2);
  expect(hash1 === hash2).toStrictEqual(false);
});
test("Exchange", () => {
  const init1 = CryptoUtil.InitExchange();
  const exchangeObject1 = init1.exchangeObject;
  const exchangeKey1 = init1.exchangeKey;
  const init2 = CryptoUtil.InvokeExchange(exchangeObject1.getPrime(), exchangeObject1.getGenerator());
  const exchangeObject2 = init2.exchangeObject;
  const exchangeKey2 = init2.exchangeKey;
  const secret1 = CryptoUtil.CalculateSecret(exchangeObject1, exchangeKey2);
  const secret2 = CryptoUtil.CalculateSecret(exchangeObject2, exchangeKey1);
  expect(secret1).toEqual(secret2);
});
test("Symmetric Encrypt - Decrypt", () => {
  const passphrase = "passphrase";
  const data = "The text to pass";
  let msg1 = CryptoUtil.SymmetricEncrypt(data, passphrase);
  const result = CryptoUtil.SymmetricDecrypt(msg1, passphrase);
  expect(result).toEqual(data);
  expect(result).toEqual(data);
});