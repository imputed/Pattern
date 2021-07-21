import CryptoUtil from "./CryptoUtil.js";
import { Controller } from "./Controller.js";
import Message from "./Message.js";
import * as fs from 'fs';
export default class MVCElement {
  #controller;
  #followingNodes;
  #publicKey;
  #privateKey;
  #initExchangeObjects;
  #invokeExchangeSecrets;
  #publicKeys;
  #messages;

  constructor(name, controller) {
    this.#controller = controller;
    this.name = name;
    this.#initExchangeObjects = new Map();
    this.#invokeExchangeSecrets = new Map();
    this.#publicKeys = new Map();
    this.#messages = new Map();
    this.#followingNodes = [];
    const returnKeys = CryptoUtil.GenerateKeys();

    if (returnKeys.isValid) {
      this.#privateKey = returnKeys.privateKey;
      this.#publicKey = returnKeys.publicKey;
      fs.writeFileSync("C:\\Users\\priva\\WebstormProjects\\pattern\\keys\\Model 0", this.#privateKey.toString());
    }
  }

  getPublicKey(requester) {
    return this.#publicKey;
  }

  setNeighbour(neighbour, signedPublicKey, publicKey) {
    if (CryptoUtil.ValidateSignature(neighbour.#publicKey, signedPublicKey, publicKey)) {
      this.#followingNodes.push(neighbour);
    }
  }

  forwardMessage(to, message, signature) {
    this.#controller.forwardMessage(this.name, to, message, signature);
  }

  receiveForward(message, from, signature) {
    const decryptedData = CryptoUtil.Decrypt(message, this.#privateKey);
    console.log("I am ", this.name, decryptedData.toString(), " from ", from.name);
  }

  initExchange() {
    const exchange = CryptoUtil.InitExchange();
    for (let i = 0; i < this.#followingNodes.length; i++) {
      this.#initExchangeObjects.set(this.#followingNodes[i].name, exchange.exchangeObject);
      this.#followingNodes[i].initResponse(this, exchange.exchangeObject.getPrime(), exchange.exchangeObject.getGenerator(), exchange.exchangeKey);
    }
  }

  initResponse(sender, exchangePrime, exchangeGenerator, exchangeKey) {
    const exchange = CryptoUtil.InvokeExchange(exchangePrime, exchangeGenerator);
    this.#invokeExchangeSecrets.set(sender.name, CryptoUtil.CalculateSecret(exchange.exchangeObject, exchangeKey));
    const data = CryptoUtil.SymmetricEncrypt(this.#publicKey, this.#invokeExchangeSecrets.get(sender.name));
    const signedEncryptedData = CryptoUtil.GenerateSignature(data, this.#privateKey);
    sender.invokeResponse(this, exchange.exchangeKey, data, signedEncryptedData);
  }

  invokeResponse(sender, exchangeKey, encryptedData, encryptedDataSignature) {
    const secret = CryptoUtil.CalculateSecret(this.#initExchangeObjects.get(sender.name), exchangeKey);
    this.#invokeExchangeSecrets.set(sender.name, secret);
    const decryptedPublicKey = CryptoUtil.SymmetricDecrypt(encryptedData, secret);

    if (CryptoUtil.ValidateSignature(encryptedData, encryptedDataSignature, decryptedPublicKey)) {
      this.#publicKeys.set(sender.name, decryptedPublicKey);
      console.log("Received Public Key: " + decryptedPublicKey + " at " + this.name + " from " + sender.name);
      const encryptedData = CryptoUtil.SymmetricEncrypt(this.#publicKey, secret);
      const signedEncryptedData = CryptoUtil.GenerateSignature(encryptedData, this.#privateKey);
      sender.InvokeFinal(this, encryptedData, signedEncryptedData);
    }
  }

  InvokeFinal(sender, encryptedData, encryptedDataSignature) {
    const decryptedPublicKey = CryptoUtil.SymmetricDecrypt(encryptedData, this.#invokeExchangeSecrets.get(sender.name));

    if (CryptoUtil.ValidateSignature(encryptedData, encryptedDataSignature, decryptedPublicKey)) {
      console.log("Received Public Key: " + decryptedPublicKey + " at " + this.name + " from " + sender.name);
      this.#publicKeys.set(sender.name, decryptedPublicKey);
    }
  }

  sendMessage(content) {
    let id = CryptoUtil.getMessageID();

    if (this.#messages.get(id) === undefined) {
      let m = new Message();
      this.#messages.set(id, m);
      m.id = id;
      m.content = content;

      for (let i = 0; i < this.#followingNodes.length; i++) {
        const encryptedMessage = CryptoUtil.Encrypt(Buffer.from(m.toString()), this.#publicKeys.get(this.#followingNodes[i].name));
        this.#followingNodes[i].receiveMessage(this, encryptedMessage);
      }
    }
  }

  receiveMessage(sender, encryptedMessage) {
    const message = CryptoUtil.Decrypt(encryptedMessage, this.#privateKey);
    let m = new Message();
    m.parseString(message.toString());

    if (this.#messages.get(m.id) === undefined) {
      console.log(this.name + " received " + m.id + " content: " + m.content + " from " + sender.name);
      this.#messages.set(m.id, m);

      for (let i = 0; i < this.#followingNodes.length; i++) {
        const encryptedMessage = CryptoUtil.Encrypt(m.toString(), this.#publicKeys.get(this.#followingNodes[i].name));
        this.#followingNodes[i].receiveMessage(this, encryptedMessage);
      }
    }
  }

}