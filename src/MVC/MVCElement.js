// @flow
import CryptoUtil from "./CryptoUtil.js";
import * as crypto from "crypto";

export default class MVCElement {
    name: string
    #value: string
    #controller: MVCElement

    #followingNode: MVCElement
    publicKey: string
    #privateKey: string
    #initExchangeObjects: Map
    #invokeExchangeObjects: Map
    #invokeExchangeSecrets: Map

    constructor(name: string, controller: MVCElement) {
        this.#controller = controller
        this.name = name
        this.#initExchangeObjects = new Map()
        this.#invokeExchangeObjects = new Map()
        this.#invokeExchangeSecrets = new Map()

        const returnKeys = CryptoUtil.GenerateKeys()

        if (returnKeys.isValid) {
            this.#privateKey = returnKeys.privateKey
            this.publicKey = returnKeys.publicKey
        }

    }

    setNeighbour(neighbour: MVCElement, signedPublicKey: string, publicKey: string) {
        if (CryptoUtil.ValidateSignature(neighbour.publicKey, signedPublicKey, publicKey)) {
            this.#followingNode = neighbour
            const data = "my secret data"

            const encryptedData = crypto.publicEncrypt(
                {
                    key: this.#followingNode.publicKey,
                    oaepHash: "sha256",
                },
                Buffer.from(data)
            )

            this.forwardMessage(this.#followingNode, encryptedData, "")
        }
    }

    changeValue(message: string, signedMessage: string) {
        if (CryptoUtil.ValidateSignature(message, signedMessage, this.#controller.publicKey)) {
            console.log("Received Change-Request at ", this.name, " from controller: ", message)
            this.#value = message
        }
    }


    forwardMessage(to: string, message: string, signature: string) {
        this.#controller.forwardMessage(this, to, message, signature)
    }


    talkToFollowingNode(message: string) {
        const data = CryptoUtil.Encrypt(message, this.#followingNode.publicKey)
        const signature = CryptoUtil.GenerateSignature(data, this.#privateKey)
        this.forwardMessage(this.#followingNode, data, signature)
    }


    receiveForward(message: string, from: MVCElement, signature: string) {
        const decryptedData = CryptoUtil.Decrypt(message, this.#privateKey)
        console.log("I am ", this.name, decryptedData.toString(), " from ", from.name)
    }

    initExchange(): void {
        const exchange = CryptoUtil.InitExchange()
        this.#initExchangeObjects.set(this.#followingNode.name, exchange.exchangeObject)
        this.#followingNode.invokeExchange(this, exchange.exchangeObject.getPrime(), exchange.exchangeObject.getGenerator(), exchange.exchangeKey)
    }

    invokeExchange(sender: MVCElement, exchangePrime: string, exchangeGenerator, exchangeKey: string) {
        const exchange = CryptoUtil.InvokeExchange(exchangePrime, exchangeGenerator)
        this.#invokeExchangeObjects.set(sender.name, exchange.exchangeObject)
        this.#invokeExchangeSecrets.set(sender.name, CryptoUtil.CalculateSecret(exchange.exchangeObject, exchangeKey))
        const encryptedData = CryptoUtil.SymmetricEncryptAsync(this.publicKey, this.#invokeExchangeSecrets.get(sender.name))
        sender.respondToInvokeExchange(this, exchange.exchangeKey, encryptedData)
    }


    respondToInvokeExchange(sender: MVCElement, exchangeKey: string, encryptedData: string): void {
        const secret = CryptoUtil.CalculateSecret(this.#initExchangeObjects.get(sender.name), exchangeKey)
        this.#invokeExchangeSecrets.set(sender.name, secret)
        console.log("Got the message: " + CryptoUtil.SymmetricDecryptSync(encryptedData, secret))
    }

    TestEncryption() {

        const text = "I am a Password!"
        const secret = "secret4exchange"
        console.log(secret,text)
        CryptoUtil.SymmetricEncryptAsync(this,text, secret)
    }


    GetEncryptedValue(data:string){
        console.log(data)
        const secret = "secret4exchange"
        const dec = CryptoUtil.SymmetricDecryptSync(this, data, secret)
        console.log(dec)

    }
}
