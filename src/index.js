import {Controller} from "./MVC/Controller.js";

const c = new Controller()
for (let i = 0; i < 10; i++) {
    c.addModel("Model_"+i)

}
c.assignNeighbours()

for (let i = 0; i < c.controlledModels.length; i++) {
    c.controlledModels[i].talkToFollowingNode("TestEncryption"+1)
}
