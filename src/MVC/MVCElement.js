// @flow
import CryptoUtil from "./CryptoUtil.js";

export default class MVCElement {
    name: string
    #value: string
    #controller: MVCElement

    #followingNode: MVCElement
    #publicKey: string
    #privateKey: string
    #initExchangeObjects: Map
    #invokeExchangeObjects: Map
    #invokeExchangeSecrets: Map
    #publicKeys: Map

    constructor(name: string, controller: MVCElement) {
        this.#controller = controller
        this.name = name
        this.#initExchangeObjects = new Map()
        this.#invokeExchangeObjects = new Map()
        this.#invokeExchangeSecrets = new Map()
        this.#publicKeys = new Map()
        const returnKeys = CryptoUtil.GenerateKeys()

        if (returnKeys.isValid) {
            this.#privateKey = returnKeys.privateKey
            this.#publicKey = returnKeys.publicKey
        }

    }

    setNeighbour(neighbour: MVCElement, signedPublicKey: string, publicKey: string) {
        if (CryptoUtil.ValidateSignature(neighbour.publicKey, signedPublicKey, publicKey)) {
            this.#followingNode = neighbour
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
        const encryptedData = CryptoUtil.SymmetricEncrypt(this.#publicKey, this.#invokeExchangeSecrets.get(sender.name))
        const signedEncryptedData = CryptoUtil.GenerateSignature(encryptedData, this.#privateKey)

        sender.respondToInvokeExchange(this, exchange.exchangeKey, encryptedData, signedEncryptedData)
    }


    respondToInvokeExchange(sender: MVCElement, exchangeKey: string, encryptedData: string, encryptedDataSignature: string): void {
        const secret = CryptoUtil.CalculateSecret(this.#initExchangeObjects.get(sender.name), exchangeKey)
        this.#invokeExchangeSecrets.set(sender.name, secret)
        const decryptedPublicKey = CryptoUtil.SymmetricDecrypt(encryptedData, secret)
        if (CryptoUtil.ValidateSignature(encryptedData, encryptedDataSignature, decryptedPublicKey)) {
            this.#publicKeys.set(sender.name, decryptedPublicKey)
            const encryptedData = CryptoUtil.SymmetricEncrypt(this.#publicKey,secret)
            const signedEncryptedData = CryptoUtil.GenerateSignature(encryptedData, this.#privateKey)
            sender.lastInvokeExchange(this,encryptedData,signedEncryptedData)

        }

    }
    lastInvokeExchange(sender: MVCElement, encryptedData: string, encryptedDataSignature: string): void {

        const decryptedPublicKey = CryptoUtil.SymmetricDecrypt(encryptedData, this.#invokeExchangeSecrets.get(sender.name))
        if (CryptoUtil.ValidateSignature(encryptedData, encryptedDataSignature, decryptedPublicKey)) {
            this.#publicKeys.set(sender.name, decryptedPublicKey)
            const data = "My First encrypted message from "+this.name
            const encrypted = CryptoUtil.Encrypt(data,decryptedPublicKey)
            const sig = CryptoUtil.GenerateSignature(encrypted, this.#privateKey)
            sender.first(this,encrypted,sig)
        }
    }

    first(sender: MVCElement, encryptedData: string, encryptedDataSignature: string): void {

       if (CryptoUtil.ValidateSignature(encryptedData, encryptedDataSignature, this.#publicKeys.get(sender.name))) {
            console.log(CryptoUtil.Decrypt(encryptedData, this.#privateKey).toString())

        }
    }

    

}
