import {Controller} from "./MVC/Controller.js";
import MVCElement from "./MVC/MVCElement.js ";


const mvc = new MVCElement()
const c = new Controller()
for (let i = 0; i < 10; i++) {
    c.addAndGenerateNode("Model_"+i)
}
c.assignNeighbours()
for (let i = 0; i < c.controlledNodes.length; i++) {
    c.controlledNodes[i].initExchange()
}

c.controlledNodes[0].sendMessage("Hallo")