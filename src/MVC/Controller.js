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

    controlledNodes: Array<MVCElement>

    noCrypto: boolean

    constructor(noCrypto: boolean) {
        const returnKeys = CryptoUtil.GenerateKeys()
        if (noCrypto === false) {
            this.#privateKey = returnKeys.privateKey
            this.publicKey = returnKeys.publicKey
        }

        this.controlledNodes = []
        this.noCrypto = noCrypto
    }

    addAndGenerateNode() {
        const newNode = new MVCElement(this.controlledNodes.length, this.noCrypto)
        this.controlledNodes.push(newNode)
    }

    addNode(node: MVCElement) {
        this.controlledNodes.push(node)
    }

    receiveProposal(value: number) {
        console.log("received proposal at controller", value)
        this.currentValue = value
        this.cast(value.toString(), this.controlledNodes)
    }

    assignNeighbours() {
        if (this.controlledNodes.length !== 0 && this.controlledNodes.length !== 1) {
            for (let i = 0; i < this.controlledNodes.length; i++) {
                const neighbourIndex = (i + 1) % (this.controlledNodes.length)
                if (neighbourIndex !== i) {
                    const signature = CryptoUtil.GenerateSignature(this.controlledNodes[neighbourIndex].getPublicKey(), this.#privateKey)
                    this.controlledNodes[i].setNeighbour(this.controlledNodes[neighbourIndex], signature, this.publicKey)
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
        const validParticipants = this.controlledNodes.filter(m => {
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

}


