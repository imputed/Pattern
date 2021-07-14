import MVCElement from "./MVCElement.js";

export default class Model extends MVCElement{
    constructor(name:string,controller: MVCElement) {
        super(name,controller)
    }
}
