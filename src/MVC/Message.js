// @flow

const separator =";"
export default class Message {
    id: string
    content: string

    toString(): string {
        return this.id + separator + this.content
    }

    parseString(input: string): void {
        const parts = input.split(separator)
        this.id=parts[0]
        this.content=parts[1]
    }
}