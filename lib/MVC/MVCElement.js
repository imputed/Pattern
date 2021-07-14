import CryptoUtil from "./CryptoUtil.js";
import * as crypto from "crypto";
export default class MVCElement {
  #value;
  #controller;
  #privateKey;
  #followingNode;

  constructor(name, controller) {
    this.#controller = controller;
    this.name = name;
    const returnKeys = CryptoUtil.GenerateKeys();

    if (returnKeys.isValid) {
      this.#privateKey = returnKeys.privateKey;
      this.publicKey = returnKeys.publicKey;
    }
  }

  setNeighbour(message, signedMessage) {
    if (CryptoUtil.ValidateSignature(message, signedMessage, this.#controller.publicKey)) {
      this.#followingNode = message;
      const signedPublicKey = CryptoUtil.GenerateSignature(this.publicKey, this.#privateKey);
      this.forwardMessage(this.#followingNode, signedPublicKey);
    }
  }

  changeValue(message, signedMessage) {
    if (this.isControllerMessageValid(message, signedMessage)) {
      console.log("Received Change-Request at ", this.name, " from controller: ", message);
      this.#value = message;
    }
  }

  proposeNewValue(value) {
    console.log("Send proposal at ", this.name, " to controller: ", value);
    this.#controller.receiveProposal(value, this);
  }

  forwardMessage(to, message) {
    this.#controller.forwardMessage(this.name, to, message);
  }

  talkToFollowingNode(message) {
    const signature = crypto.sign("sha256", Buffer.from(message), {
      key: this.#privateKey
    });
    this.forwardMessage(this.#followingNode, signature);
  }

  receiveForward(message, from) {
    console.log("I am ", this.name, message, " from ", from.name);
  }

}