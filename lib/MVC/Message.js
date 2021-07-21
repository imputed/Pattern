const separator = ";";
export default class Message {
  toString() {
    return this.id + separator + this.content;
  }

  parseString(input) {
    const parts = input.split(separator);
    this.id = parts[0];
    this.content = parts[1];
  }

}