import CryptoUtil from "./CryptoUtil.js";
import * as crypto from "crypto";
export default class MVCElement {
  #value;
  #controller;
  #followingNode;
  #privateKey;
  #initExchangeObjects;
  #invokeExchangeObjects;
  #invokeExchangeSecrets;
  #publicKeys;

  constructor(name, controller) {
    this.#controller = controller;
    this.name = name;
    this.#initExchangeObjects = new Map();
    this.#invokeExchangeObjects = new Map();
    this.#invokeExchangeSecrets = new Map();
    this.#publicKeys = new Map();
    const returnKeys = CryptoUtil.GenerateKeys();

    if (returnKeys.isValid) {
      this.#privateKey = returnKeys.privateKey;
      this.publicKey = returnKeys.publicKey;
    }
  }

  setNeighbour(neighbour, signedPublicKey, publicKey) {
    if (CryptoUtil.ValidateSignature(neighbour.publicKey, signedPublicKey, publicKey)) {
      this.#followingNode = neighbour;
    }
  }

  changeValue(message, signedMessage) {
    if (CryptoUtil.ValidateSignature(message, signedMessage, this.#controller.publicKey)) {
      console.log("Received Change-Request at ", this.name, " from controller: ", message);
      this.#value = message;
    }
  }

  forwardMessage(to, message, signature) {
    this.#controller.forwardMessage(this, to, message, signature);
  }

  talkToFollowingNode(message) {
    const data = CryptoUtil.Encrypt(message, this.#followingNode.publicKey);
    const signature = CryptoUtil.GenerateSignature(data, this.#privateKey);
    this.forwardMessage(this.#followingNode, data, signature);
  }

  receiveForward(message, from, signature) {
    const decryptedData = CryptoUtil.Decrypt(message, this.#privateKey);
    console.log("I am ", this.name, decryptedData.toString(), " from ", from.name);
  }

  initExchange() {
    const exchange = CryptoUtil.InitExchange();
    this.#initExchangeObjects.set(this.#followingNode.name, exchange.exchangeObject);
    this.#followingNode.invokeExchange(this, exchange.exchangeObject.getPrime(), exchange.exchangeObject.getGenerator(), exchange.exchangeKey);
  }

  invokeExchange(sender, exchangePrime, exchangeGenerator, exchangeKey) {
    const exchange = CryptoUtil.InvokeExchange(exchangePrime, exchangeGenerator);
    this.#invokeExchangeObjects.set(sender.name, exchange.exchangeObject);
    this.#invokeExchangeSecrets.set(sender.name, CryptoUtil.CalculateSecret(exchange.exchangeObject, exchangeKey));
    const encryptedData = CryptoUtil.SymmetricEncrypt(this.publicKey, this.#invokeExchangeSecrets.get(sender.name));
    const signedEncryptedData = CryptoUtil.GenerateSignature(encryptedData, this.#privateKey);
    sender.respondToInvokeExchange(this, exchange.exchangeKey, encryptedData, signedEncryptedData);
  }

  respondToInvokeExchange(sender, exchangeKey, encryptedData, encryptedDataSignature) {
    const secret = CryptoUtil.CalculateSecret(this.#initExchangeObjects.get(sender.name), exchangeKey);
    this.#invokeExchangeSecrets.set(sender.name, secret);
    const decryptedPublicKey = CryptoUtil.SymmetricDecrypt(encryptedData, secret);

    if (CryptoUtil.ValidateSignature(encryptedData, encryptedDataSignature, decryptedPublicKey)) {
      this.#publicKeys.set(sender.name, decryptedPublicKey);
      const encryptedData = CryptoUtil.SymmetricEncrypt(this.publicKey, secret);
      const signedEncryptedData = CryptoUtil.GenerateSignature(encryptedData, this.#privateKey);
      sender.lastInvokeExchange(this, encryptedData, signedEncryptedData);
    }
  }

  lastInvokeExchange(sender, encryptedData, encryptedDataSignature) {
    const decryptedPublicKey = CryptoUtil.SymmetricDecrypt(encryptedData, this.#invokeExchangeSecrets.get(sender.name));

    if (CryptoUtil.ValidateSignature(encryptedData, encryptedDataSignature, decryptedPublicKey)) {
      this.#publicKeys.set(sender.name, decryptedPublicKey);
      const data = "My First encrypted message from " + this.name;
      const encrypted = CryptoUtil.Encrypt(data, decryptedPublicKey);
      const sig = CryptoUtil.GenerateSignature(encrypted, this.#privateKey);
      sender.first(this, encrypted, sig);
    }
  }

  first(sender, encryptedData, encryptedDataSignature) {
    if (CryptoUtil.ValidateSignature(encryptedData, encryptedDataSignature, this.#publicKeys.get(sender.name))) {
      console.log(CryptoUtil.Decrypt(encryptedData, this.#privateKey).toString());
    }
  }

}