// @flow

import CryptoUtil from "./CryptoUtil.js";

const separator =";"
export default class Message {
    id: string
    title:string
    content: ArrayBuffer

    constructor(title:string, content:ArrayBuffer) {
        const dec = new TextDecoder()
        this.id = CryptoUtil.HashContent(title + dec.decode(content))
        this.title = title
        this.content=content
    }
    

    toString(): string {
        return this.id + separator + this.title + separator + this.content
    }

    parseString(input: string): void {
        const parts = input.split(separator)
        this.id=parts[0]
        this.title=parts[1]
        this.content=parts[2]
    }
}