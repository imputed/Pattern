import Model from "./Model.js";
import View from "./View.js";
import MVCElement from "./MVCElement.js";
import CryptoUtil, { ReturnKeys } from "./CryptoUtil.js";
import * as crypto from "crypto";
const MessageType = {
  setValue: 0,
  assignNeighbour: 1,
  forward: 2
};
export class Controller {
  #privateKey;

  constructor() {
    const returnKeys = CryptoUtil.GenerateKeys();

    if (returnKeys.isValid) {
      this.#privateKey = returnKeys.privateKey;
      this.publicKey = returnKeys.publicKey;
    }

    this.controlledModels = [];
  }

  addModel(name) {
    const newModel = new Model(name, this);
    this.controlledModels.push(newModel);
  }

  receiveProposal(value) {
    console.log("received proposal at controller", value);
    this.currentValue = value;
    this.cast(value.toString(), this.controlledModels);
  }

  assignNeighbours() {
    if (this.controlledModels.length !== 0) {
      for (let i = 0; i < this.controlledModels.length; i++) {
        let neighbour = this.controlledModels[(i + 1) % this.controlledModels.length];
        const signature = CryptoUtil.GenerateSignature(neighbour.publicKey, this.#privateKey);
        this.controlledModels[i].setNeighbour(neighbour, signature, this.publicKey);
      }
    }
  }

  cast(type, message, receiver, sender, signature) {
    const controllerSignature = CryptoUtil.GenerateSignature(message, this.#privateKey);

    if (type === MessageType.setValue) {
      for (let i = 0; i < receiver.length; i++) {
        receiver[i].changeValue(message, controllerSignature);
      }
    } else if (type === MessageType.assignNeighbour) {
      for (let i = 0; i < receiver.length; i++) {
        receiver[i].setNeighbour(message, controllerSignature);
      }
    } else if (type === MessageType.forward) {
      for (let i = 0; i < receiver.length; i++) {
        receiver[i].receiveForward(message, sender, signature);
      }
    }
  }

  forwardMessage(from, to, message, signature) {
    const validParticipants = this.controlledModels.filter(m => {
      return m.name === to.name || m.name === from.name;
    });

    if (validParticipants.length === 2) {
      const recipients = validParticipants.filter(m => {
        return m.name === to.name;
      });
      const sender = validParticipants.filter(m => {
        return m.name === from.name;
      })[0];
      this.cast(MessageType.forward, message, recipients, sender, signature);
    }
  }

}