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

  setNeighbour(neighbour, signedPublicKey, publicKey) {
    if (CryptoUtil.ValidateSignature(neighbour.publicKey, signedPublicKey, publicKey)) {
      this.#followingNode = neighbour;
      const data = "my secret data";
      const encryptedData = crypto.publicEncrypt({
        key: this.#followingNode.publicKey,
        oaepHash: "sha256"
      }, // We convert the data string to a buffer using `Buffer.from`
      Buffer.from(data));
      this.forwardMessage(this.#followingNode, encryptedData, "");
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

  forwardMessage(to, message, signature) {
    this.#controller.forwardMessage(this, to, message, signature);
  }

  talkToFollowingNode(message) {
    const signature = crypto.sign("sha256", Buffer.from(message), {
      key: this.#privateKey
    });
    this.forwardMessage(this.#followingNode, message, signature);
  }

  receiveForward(message, from, signature) {
    const decryptedData = crypto.privateDecrypt({
      key: this.#privateKey,
      oaepHash: "sha256"
    }, message);
    console.log("I am ", this.name, decryptedData.toString(), " from ", from.name);
  }

}