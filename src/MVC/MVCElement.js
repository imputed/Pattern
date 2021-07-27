import CryptoUtil from "./CryptoUtil.js";
import Message from "./Message.js";

export default class MVCElement {
    #followingNodes: Array<MVCElement>
    #publicKey: string
    #privateKey: string
    #initExchangeObjects: Map
    #invokeExchangeSecrets: Map
    #publicKeys: Map
    #messages: Map
    #messageQueue: Map


    constructor(noCrypto: boolean) {
        this.#initExchangeObjects = new Map()
        this.#invokeExchangeSecrets = new Map()
        this.#publicKeys = new Map()
        this.#messages = new Map()
        this.#followingNodes = []
        this.#messageQueue = new Map()
        if (noCrypto) {
            const returnKeys = CryptoUtil.GenerateKeys()
            this.#privateKey = returnKeys.privateKey
            this.#publicKey = returnKeys.publicKey
        }

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
            console.log("Received Public Key" + " at " + this.name + " from " + sender.name)
            this.#publicKeys.set(sender.name, decryptedPublicKey)
        }
    }

    sendMessage(message: Message, receiver: MVCElement) {
        if (this.#messages.get(message.id.digest("hex")) === undefined) {
            this.#messages.set(message.id.digest("hex"), m)
            const encryptedMessage = CryptoUtil.Encrypt(Buffer.from(message.toString()), receiver.getPublicKey())
            this.#followingNodes[i].receiveMessage(this, encryptedMessage)
        }
    }


    receiveMessage(encryptedMessage: string, sender: MVCElement) {
        const message = CryptoUtil.Decrypt(encryptedMessage, this.#privateKey)
        if (this.#messages.get(message.id) === undefined) {
            console.log(this.name + " received " + message.content + " from " + sender.name)
            this.#messages.set(message.id, message)
        }
    }

    addStorageElement(title: string, content: string): Message {
        let m = new Message(title, content)

        let sendCount = 0
        for (let i = 0; i < this.#followingNodes.length; i++) {
            this.sendMessage(m, this.#followingNodes[i])
            sendCount++
        }
        this.#messageQueue.set(m.getQueueRepresentation(), {message: m, sent: sendCount, received: 0})

    }

    getStatus(title, content): { message: Message, sent: number, received: number } {
        let m = new Message(title,content)
        const queueRepresentation = m.getQueueRepresentation()
        if (this.#messageQueue.has(queueRepresentation)) {
            let sent = this.#messageQueue.get(queueRepresentation).sent
            let received = this.#messageQueue.get(queueRepresentation).received
            return {sent: sent,received: received}
        }else {
            return {sent: -1,received: -1}
        }

    }

    ExportPublicKeys(): Map {
        let signedPublicKeys = new Map()
        this.#publicKeys.forEach(((value, key) => {
            signedPublicKeys.set(key, CryptoUtil.GenerateSignature(value, this.#privateKey))
        }))
        return signedPublicKeys
    }


}
