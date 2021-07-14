import MVCElement from "./MVCElement.js";
export default class View extends MVCElement {

    constructor(name:string, controller: MVCElement) {
        super(name, controller );
    }

}