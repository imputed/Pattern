import Model from "./Model.js";
import MVCElement from "./MVCElement.js";
import CryptoUtil from "./CryptoUtil.js";


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
                const neighbours = this.getNeighbours(this.controlledModels[i],i,2,2)
                for (let j = 0; j < neighbours.length  ; j++) {

                    const signature = CryptoUtil.GenerateSignature(neighbours[j].getPublicKey(this), this.#privateKey)
                    this.controlledModels[i].setNeighbour(neighbours[j], signature, this.publicKey)
                }

            }
        }
    }

    cast(type: MessageType, message: string, receiver: Array<MVC>, sender: MVCElement, signature) {

        const controllerSignature = CryptoUtil.GenerateSignature(message, this.#privateKey)

        if (type === MessageType.setValue) {
            for (let i = 0; i < receiver.length; i++) {
                receiver[i].changeValue(message, controllerSignature)
            }
        } else if (type === MessageType.assignNeighbour) {
            for (let i = 0; i < receiver.length; i++) {
                receiver[i].setNeighbour(message, controllerSignature)
            }
        } else if (type === MessageType.forward) {
            for (let i = 0; i < receiver.length; i++) {
                receiver[i].receiveForward(message, sender, signature)
            }
        }
    }

    forwardMessage(from: MVCElement, to: MVCElement, message: string, signature: string) {
        const validParticipants = this.controlledModels.filter(m => {
            return m.name === to.name || m.name === from.name
        })

        if (validParticipants.length === 2) {
            const recipients = validParticipants.filter(m => {
                return m.name === to.name
            })
            const sender = validParticipants.filter(m => {
                return m.name === from.name
            })[0]

            this.cast(MessageType.forward, message, recipients, sender, signature)
        }
    }

    getNeighbours(node: MVCElement, start: number, stepsize: number, desiredCount: number): Array<MVCElement> {
        let neighbours = []
        let pos = (start + stepsize) % this.controlledModels.length
        while (neighbours.length !== desiredCount) {
            neighbours.push(this.controlledModels[pos])
            pos = (pos + stepsize) % this.controlledModels.length
        }
        return neighbours


    }
}


