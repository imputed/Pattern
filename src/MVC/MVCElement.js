import CryptoUtil from "./CryptoUtil.js";
import * as crypto from "crypto";

export default class MVCElement {
    name: string
    #value: string
    #controller: MVCElement
    #privateKey: string
    #followingNode: MVCElement
    publicKey: string

    constructor(name: string, controller: MVCElement) {
        this.#controller = controller
        this.name = name

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
        if (CryptoUtil.ValidateSignature(message, signedMessage,this.#controller.publicKey)) {
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


    receiveForward(message: string, from: MVCElement, signature:string) {
        const decryptedData = CryptoUtil.Decrypt(message, this.#privateKey)
            console.log("I am ", this.name, decryptedData.toString(), " from ", from.name)
    }

}
