import Model from "./Model.js";
import View from "./View.js"
import MVCElement from "./MVCElement.js";
import CryptoUtil, {ReturnKeys} from "./CryptoUtil.js";
import * as crypto from "crypto";


const MessageType = {
    setValue: 0,
    assignNeighbour: 1,
    forward: 2,
}

export class Controller {
    #privateKey: string
    publicKey: string
    currentValue: number
    controlledModels: Array<MVCElement>

    constructor() {
        const returnKeys = CryptoUtil.GenerateKeys()

        if (returnKeys.isValid) {
            this.#privateKey = returnKeys.privateKey
            this.publicKey = returnKeys.publicKey
        }
        this.controlledModels = []
    }

    addModel(name: string) {
        const newModel = new Model(name, this)
        this.controlledModels.push(newModel)
    }

    receiveProposal(value: number) {
        console.log("received proposal at controller", value)
        this.currentValue = value
        this.cast(value.toString(), this.controlledModels)
    }

    assignNeighbours() {
        if (this.controlledModels.length !== 0) {
            for (let i = 0; i < this.controlledModels.length; i++) {
                this.cast(MessageType.assignNeighbour,  this.controlledModels[((i + 1) % this.controlledModels.length)].name, [this.controlledModels[i]])
            }
        }
    }

    cast(type: MessageType, message: string, receiver: Array<MVC>, sender: MVCElement) {

            const signature = CryptoUtil.GenerateSignature(message,this.#privateKey)

            if (type === MessageType.setValue) {
                for (let i = 0; i < receiver.length; i++) {
                    receiver[i].changeValue(message, signature)
                }
            } else if (type === MessageType.assignNeighbour) {
                for (let i = 0; i < receiver.length; i++) {
                    receiver[i].setNeighbour(message, signature)
                }
            } else if (type === MessageType.forward) {
                for (let i = 0; i < receiver.length; i++) {
                    receiver[i].receiveForward(message, sender)
                }
            }
    }

    forwardMessage(from: string, to: string, message: string) {
        const validParticipants = this.controlledModels.filter(m => {
            return m.name === to || m.name === from
        })

        if (validParticipants.length === 2) {
            const recipients = validParticipants.filter(m => {
                return m.name === to
            })
            const sender = validParticipants.filter(m => {
                return m.name === from
            })[0]

            this.cast(MessageType.forward,message, recipients,sender)
        }
    }
}