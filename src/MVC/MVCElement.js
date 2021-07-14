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

    setNeighbour(message: string, signedMessage: string) {
        if (CryptoUtil.ValidateSignature(message,signedMessage,this.#controller.publicKey)) {
            this.#followingNode = message
            const signedPublicKey = CryptoUtil.GenerateSignature(this.publicKey,this.#privateKey)
            this.forwardMessage(this.#followingNode,signedPublicKey)
        }
    }

    changeValue(message: string, signedMessage: string) {
        if (this.isControllerMessageValid(message, signedMessage)) {
            console.log("Received Change-Request at ", this.name, " from controller: ", message)
            this.#value = message
        }
    }

    proposeNewValue(value: number) {
        console.log("Send proposal at ", this.name, " to controller: ", value)
        this.#controller.receiveProposal(value, this)
    }

    forwardMessage(to: string, message: string) {
        this.#controller.forwardMessage(this.name, to, message)
    }

    talkToFollowingNode(message:string){
        const signature = crypto.sign("sha256", Buffer.from(message), {
            key: this.#privateKey
        })
        this.forwardMessage(this.#followingNode,signature)
    }


    receiveForward(message: string, from: MVCElement) {
        console.log("I am ", this.name, message, " from ", from.name)
    }

}
