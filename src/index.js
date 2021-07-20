import {Controller} from "./MVC/Controller.js";
import Model from "./MVC/Model.js";

const mvc = new Model()
// mvc.TestEncryption()
const c = new Controller()
for (let i = 0; i < 5; i++) {
    c.addModel("Model_"+i)
}
c.assignNeighbours()
for (let i = 0; i < c.controlledModels.length; i++) {
    c.controlledModels[i].initExchange()
}
