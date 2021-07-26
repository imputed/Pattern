import * as assert from "assert";
import CryptoUtil from "../MVC/CryptoUtil.js";

describe('Array', function () {
    describe('#indexOf()', function () {
        it('should return -1 when the value is not present', function () {
            assert.strictEqual([1, 2, 3].indexOf(4), -1);
        });
    });
});


describe("Private/Public Encryption/Decryption Testing", () => {
    describe("Function GenerateKeys()", function () {
        it("Positive Case", function () {
            const {
                privateKey,
                publicKey
            } = CryptoUtil.GenerateKeys();
            const message = "Test the encryption and decryption with Priv/Pub Key";
            const encrypt = CryptoUtil.Encrypt(message, publicKey);
            const decrypt = CryptoUtil.Decrypt(encrypt, privateKey);
            assert.strictEqual(decrypt.toString(), message)
            assert.notStrictEqual(privateKey, "")
        })
    }),
        describe("Signature ", function () {
                it("Positive Case", function () {
                    const {
                        privateKey,
                        publicKey
                    } = CryptoUtil.GenerateKeys();
                    const message = "Test the signature";
                    const signature = CryptoUtil.GenerateSignature(message, privateKey);
                    const checkedSignature = CryptoUtil.ValidateSignature(message, signature, publicKey);
                    assert.strictEqual(checkedSignature, true)
                }),
                    it("Negative Case", function () {
                        const {
                            privateKey,
                            publicKey
                        } = CryptoUtil.GenerateKeys();
                        const fake = CryptoUtil.GenerateKeys();
                        const message = "Test the signature";
                        const signature = CryptoUtil.GenerateSignature(message, fake.privateKey);
                        const checkedSignature = CryptoUtil.ValidateSignature(message, signature, publicKey);
                        assert.strictEqual(checkedSignature, false);
                    })
            }
        ),
        describe("DH - Exchange", function () {
            it('should pass', function () {
                const init1 = CryptoUtil.InitExchange();
                const exchangeObject1 = init1.exchangeObject;
                const exchangeKey1 = init1.exchangeKey;
                const init2 = CryptoUtil.InvokeExchange(exchangeObject1.getPrime(), exchangeObject1.getGenerator());
                const exchangeObject2 = init2.exchangeObject;
                const exchangeKey2 = init2.exchangeKey;
                const secret1 = CryptoUtil.CalculateSecret(exchangeObject1, exchangeKey2);
                const secret2 = CryptoUtil.CalculateSecret(exchangeObject2, exchangeKey1);
                assert.deepStrictEqual(secret1, secret2);
            });
        })

});
describe("Symmetric Encryption", () => {
    it("should pass", function () {
        const passphrase = "passphrase";
        const data = "The text to pass";
        let msg1 = CryptoUtil.SymmetricEncrypt(data, passphrase);
        const result = CryptoUtil.SymmetricDecrypt(msg1, passphrase);
        assert.strictEqual(result, data);
    })
});