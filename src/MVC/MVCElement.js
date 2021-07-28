// @flow
import CryptoUtil from "./CryptoUtil.js";
import Message from "./Message.js";

export default class MVCElement {
    id: number
    #followingNodes: Array<MVCElement>
    #publicKey: string
    #privateKey: string
    #initExchangeObjects: Map<string, any>
    #invokeExchangeSecrets: Map<string, any>
    #publicKeys: Map<string, any>
    #messages: Map<string, any>
    #messageQueue: Map<string, any>


    constructor(identifier: number, noCrypto: boolean) {
        if (noCrypto === false) {
            const returnKeys = CryptoUtil.GenerateKeys()
            this.#privateKey = returnKeys.privateKey
            this.#publicKey = returnKeys.publicKey
        }

        this.id = identifier

        this.#initExchangeObjects = new Map()
        this.#invokeExchangeSecrets = new Map()
        this.#publicKeys = new Map()
        this.#messages = new Map()
        this.#messageQueue = new Map()

        this.#followingNodes = []
    }

    getPublicKey(): string {
        return this.#publicKey
    }

    getFollowingNodes(): Array<MVCElement> {
        return this.#followingNodes
    }

    setNeighbour(neighbour: MVCElement, signedPublicKey: string, publicKey: string) {
        if (CryptoUtil.ValidateSignature(neighbour.#publicKey, signedPublicKey, publicKey)) {
            this.#followingNodes.push(neighbour)
        }
    }


    initExchange(): void {
        const exchange = CryptoUtil.InitExchange()
        for (let i = 0; i < this.#followingNodes.length; i++) {
            this.#initExchangeObjects.set(this.#followingNodes[i].id, exchange.exchangeObject)
            this.#followingNodes[i].initResponse(this, exchange.exchangeObject.getPrime(), exchange.exchangeObject.getGenerator(), exchange.exchangeKey)
        }
    }

    initResponse(sender: MVCElement, exchangePrime: string, exchangeGenerator: string, exchangeKey: string) {
        const exchange = CryptoUtil.InvokeExchange(exchangePrime, exchangeGenerator)
        this.#invokeExchangeSecrets.set(sender.id, CryptoUtil.CalculateSecret(exchange.exchangeObject, exchangeKey))

        const data = CryptoUtil.SymmetricEncrypt(this.#publicKey, this.#invokeExchangeSecrets.get(sender.id))
        const signedEncryptedData = CryptoUtil.GenerateSignature(data, this.#privateKey)
        sender.invokeResponse(this, exchange.exchangeKey, data, signedEncryptedData)

    }

    invokeResponse(sender: MVCElement, exchangeKey: string, encryptedData: string, encryptedDataSignature: string): void {
        const secret = CryptoUtil.CalculateSecret(this.#initExchangeObjects.get(sender.id), exchangeKey)
        this.#invokeExchangeSecrets.set(sender.id, secret)
        const decryptedPublicKey = CryptoUtil.SymmetricDecrypt(encryptedData, secret)
        if (CryptoUtil.ValidateSignature(encryptedData, encryptedDataSignature, decryptedPublicKey)) {
            this.#publicKeys.set(sender.id, decryptedPublicKey)
            console.log("Received Public Key: " + decryptedPublicKey + " at " + this.id + " from " + sender.id)
            const encryptedData = CryptoUtil.SymmetricEncrypt(this.#publicKey, secret)
            const signedEncryptedData = CryptoUtil.GenerateSignature(encryptedData, this.#privateKey)
            sender.InvokeFinal(this, encryptedData, signedEncryptedData)
        }
    }

    InvokeFinal(sender: MVCElement, encryptedData: string, encryptedDataSignature: string): void {
        const decryptedPublicKey = CryptoUtil.SymmetricDecrypt(encryptedData, this.#invokeExchangeSecrets.get(sender.id))
        if (CryptoUtil.ValidateSignature(encryptedData, encryptedDataSignature, decryptedPublicKey)) {
            console.log("Received Public Key" + " at " + this.id + " from " + sender.id)
            this.#publicKeys.set(sender.id, decryptedPublicKey)
        }
    }

    sendMessage(message: Message, receiver: MVCElement) {
            console.log("send message from:" + this.id + " to " + receiver.id)
            const encryptedMessage = CryptoUtil.Encrypt(Buffer.from(message.toString()), receiver.getPublicKey())
            receiver.receiveMessage(encryptedMessage,this)
        }

    receiveMessage(encryptedMessage: string, sender: MVCElement) {
        const message = CryptoUtil.Decrypt(encryptedMessage, this.#privateKey)
        console.log("received message from:" + this.id + " to " + sender.id)
        console.log(message)
    }

    addStorageElement(title: string, content: string): Message {
        let m = new Message(title, content)

        let sendCount = 0
        for (let i = 0; i < this.#followingNodes.length; i++) {
            this.sendMessage(m, this.#followingNodes[i])
            sendCount++
        }
        this.#messageQueue.set(Message.GetQueueRepresentation(m), {message: m, sent: sendCount, received: 0})
        this.sendMessage(m,this.#followingNodes[0])

    }

    getStatus(title: string, content: array<number>): { sent: number, received: number } {

        const queueRepresentation = Message.GetQueueRepresentation(title, content)
        if (this.#messageQueue.has(queueRepresentation)) {
            const obj = this.#messageQueue.get(queueRepresentation)
            let sent = obj.sent
            let received = obj.received
            return {sent: sent, received: received}
        } else {
            return {sent: -1, received: -1}
        }

    }

    ExportPublicKeys(): Map<string, string> {
        let signedPublicKeys = new Map()
        this.#publicKeys.forEach(((value, key) => {
            signedPublicKeys.set(key, CryptoUtil.GenerateSignature(value, this.#privateKey))
        }))
        return signedPublicKeys
    }


}
