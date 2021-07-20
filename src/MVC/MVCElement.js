import CryptoUtil from "./CryptoUtil.js";
import {Controller} from "./Controller.js";

export default class MVCElement {
    name: string
    #controller: Controller
    #followingNodes: Array<MVCElement>
    #publicKey: string
    #privateKey: string
    #initExchangeObjects: Map
    #invokeExchangeSecrets: Map
    #publicKeys: Map

    constructor(name: string, controller: MVCElement) {
        this.#controller = controller
        this.name = name
        this.#initExchangeObjects = new Map()
        this.#invokeExchangeSecrets = new Map()
        this.#publicKeys = new Map()
        this.#followingNodes = []
        const returnKeys = CryptoUtil.GenerateKeys()

        if (returnKeys.isValid) {
            this.#privateKey = returnKeys.privateKey
            this.#publicKey = returnKeys.publicKey
        }
    }

    getPublicKey(requester: Controller): string {
        return this.#publicKey
    }

    setNeighbour(neighbour: MVCElement, signedPublicKey: string, publicKey: string) {
        if (CryptoUtil.ValidateSignature(neighbour.#publicKey, signedPublicKey, publicKey)) {
            this.#followingNodes.push(neighbour)
        }
    }


    forwardMessage(to: string, message: string, signature: string) {
        this.#controller.forwardMessage(this.name, to, message, signature)
    }


    receiveForward(message: string, from: MVCElement, signature: string) {
        const decryptedData = CryptoUtil.Decrypt(message, this.#privateKey)
        console.log("I am ", this.name, decryptedData.toString(), " from ", from.name)
    }

    initExchange(): void {
        const exchange = CryptoUtil.InitExchange()
        for (let i = 0; i < this.#followingNodes.length; i++) {
            this.#initExchangeObjects.set(this.#followingNodes[i].name, exchange.exchangeObject)
            this.#followingNodes[i].initResponse(this, exchange.exchangeObject.getPrime(), exchange.exchangeObject.getGenerator(), exchange.exchangeKey)
        }
    }

    initResponse(sender: MVCElement, exchangePrime: string, exchangeGenerator: string, exchangeKey: string) {
        const exchange = CryptoUtil.InvokeExchange(exchangePrime, exchangeGenerator)
        this.#invokeExchangeSecrets.set(sender.name, CryptoUtil.CalculateSecret(exchange.exchangeObject, exchangeKey))
        const data = CryptoUtil.SymmetricEncrypt(this.#publicKey, this.#invokeExchangeSecrets.get(sender.name))
        const signedEncryptedData = CryptoUtil.GenerateSignature(data, this.#privateKey)
        sender.invokeResponse(this, exchange.exchangeKey, data, signedEncryptedData)

    }

    invokeResponse(sender: MVCElement, exchangeKey: string, encryptedData: string, encryptedDataSignature: string): void {
        const secret = CryptoUtil.CalculateSecret(this.#initExchangeObjects.get(sender.name), exchangeKey)
        this.#invokeExchangeSecrets.set(sender.name, secret)
        const decryptedPublicKey = CryptoUtil.SymmetricDecrypt(encryptedData, secret)
        if (CryptoUtil.ValidateSignature(encryptedData, encryptedDataSignature, decryptedPublicKey)) {
            this.#publicKeys.set(sender.name, decryptedPublicKey)
            console.log("Received Public Key: " + decryptedPublicKey + " at " + this.name + " from " + sender.name)
            const encryptedData = CryptoUtil.SymmetricEncrypt(this.#publicKey, secret)
            const signedEncryptedData = CryptoUtil.GenerateSignature(encryptedData, this.#privateKey)
            sender.InvokeFinal(this, encryptedData, signedEncryptedData)
        }
    }

    InvokeFinal(sender: MVCElement, encryptedData: string, encryptedDataSignature: string): void {
        const decryptedPublicKey = CryptoUtil.SymmetricDecrypt(encryptedData, this.#invokeExchangeSecrets.get(sender.name))
        if (CryptoUtil.ValidateSignature(encryptedData, encryptedDataSignature, decryptedPublicKey)) {
            console.log("Received Public Key: " + decryptedPublicKey + " at " + this.name + " from " + sender.name)
            this.#publicKeys.set(sender.name, decryptedPublicKey)
        }
    }


}
