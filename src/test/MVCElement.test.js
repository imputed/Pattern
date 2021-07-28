import sinon from "sinon";
import chai from "chai";
import MVCElement from "../MVC/MVCElement.js";
import {Controller} from "../MVC/Controller.js";
import CryptoUtil from "../MVC/CryptoUtil.js";

describe('Mock', function () {
    describe('Basic Functionality', function () {
        describe("Get Public Key", function () {
            it('Positiv', function () {
                let c = prepareExchange(1)
                let fake = sinon.replace(c.controlledNodes[0], "getPublicKey", sinon.fake(c.controlledNodes[0].getPublicKey));
                let i = c.controlledNodes[0].getPublicKey();
                chai.expect(fake.callCount).to.equal(1);
            });
        }), describe("AssignNeighbours", function () {
            it('Positiv', function () {

                let n1 = [];
                let n2 = [];
                let n3 = [];

                let c = prepareExchange(3)

                c.controlledNodes.forEach(node => {
                    if (node.id === c.controlledNodes[0].id) {
                        let nodes = node.getFollowingNodes();
                        n1.push(...nodes);
                    } else if(node.id ===c.controlledNodes[1]){
                        n2.push(...nodes)
                    }else if(node.id ===c.controlledNodes[2]){
                        n3.push(...nodes)
                    }
                });

                chai.expect(n1).to.contain(c.controlledNodes[1])
                chai.expect(n2).to.contain(c.controlledNodes[2])
                chai.expect(n3).to.contain(c.controlledNodes[0])
            });
        })

    });
});

describe("Exchange Keys", function () {
    it('should return true and proof that every node can encrypted communicate to the following in circle', function () {

        let c = prepareExchange()
        let map0 = c.controlledNodes[0].ExportPublicKeys()
        let map1 = c.controlledNodes[1].ExportPublicKeys()
        let map2 = c.controlledNodes[2].ExportPublicKeys()

        let public0 = c.controlledNodes[0].getPublicKey()
        let public1 = c.controlledNodes[1].getPublicKey()
        let public2 = c.controlledNodes[2].getPublicKey()

        let signedPublic1By0 = map0.get(c.controlledNodes[1].name)
        let signedPublic2By1 = map1.get(c.controlledNodes[2].name)
        let signedPublic0By2 = map2.get(c.controlledNodes[0].name)

        chai.expect(CryptoUtil.ValidateSignature(public0, signedPublic0By2, public2)).to.be.true
        chai.expect(CryptoUtil.ValidateSignature(public1, signedPublic1By0, public0)).to.be.true
        chai.expect(CryptoUtil.ValidateSignature(public2, signedPublic2By1, public1)).to.be.true
    });
})
describe('should add the message and store it in queue and return sent and received with 0', function () {
    it('test the positive case', function () {
        const name = "Node"
        let node = new MVCElement(name, true)
        let buffer = new ArrayBuffer(16)
        for (let i = 0; i < buffer.byteLength; i++) {
            buffer[i] = 1 + i
        }
        const randomTitle = "Random Title"
        node.addStorageElement(randomTitle, buffer)
        const elem = node.getStatus(randomTitle, buffer)
        chai.expect(elem.sent).to.equal(0);
        chai.expect(elem.received).to.equal(0);
    })
})

describe('should add the message and store it in queue and return sent and received with 0', function () {
    it('test the negative', function () {
        const name = "Node"
        let node = new MVCElement(name, true)
        let buffer = new ArrayBuffer(16)
        for (let i = 0; i < buffer.byteLength; i++) {
            buffer[i] = 1 + i
        }
        const randomTitle = "Random Title"
        node.addStorageElement("dfdfd", buffer)
        const elem = node.getStatus(randomTitle, buffer)
        chai.expect(elem.sent).to.equal(-1);
        chai.expect(elem.received).to.equal(-1);
    })
})

describe("Add Message", function () {
    it('should add the message and store it for later use', function () {
        let buffer = new ArrayBuffer(16)
        for (let i = 0; i < buffer.byteLength; i++) {
            buffer[i] = 1 + i
        }
        const randomTitle = "Random Title"

        let c = prepareExchange(2);
        let fake = sinon.replace(c.controlledNodes[1], "receiveMessagdfe", sinon.fake(c.controlledNodes[0].receiveMessage));

        c.controlledNodes[0].addStorageElement(randomTitle, buffer)

        chai.expect(fake.callCount).to.equal(1);
    });
});


function prepareExchange(count: number): Controller {
    let c = new Controller(false);

    for (let i = 0; i < count; i++) {
        c.addAndGenerateNode()
    }

    c.assignNeighbours();
    for (let i = 0; i < c.controlledNodes.length; i++) {
        c.controlledNodes[i].initExchange()
    }

    return c
}