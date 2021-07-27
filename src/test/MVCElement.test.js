import sinon from "sinon";
import chai from "chai";
import MVCElement from "../MVC/MVCElement.js";
import {Controller} from "../MVC/Controller.js";
import CryptoUtil from "../MVC/CryptoUtil.js";
import Message from "../MVC/Message.js";

describe('Mock', function () {
    describe('Basic Functionality', function () {
        describe("Get Public Key", function () {
            it('Positiv', function () {

                let mvc = new MVCElement("M1")
                let fake = sinon.replace(mvc, "getPublicKey", sinon.fake(mvc.getPublicKey))

                let i = mvc.getPublicKey()
                chai.expect(fake.callCount).to.equal(1)
            });
        }), describe("AssignNeighbours", function () {
            it('Positiv', function () {
                const name1 = "Node 1"
                const name2 = "Node 2"
                const name3 = "Node 3"

                let c = new Controller();
                let node = new MVCElement(name1, c)
                let node2 = new MVCElement(name2, c)
                let node3 = new MVCElement(name3, c)

                c.addMVCNode(node)
                c.addMVCNode(node2)
                c.addMVCNode(node3)

                c.assignNeighbours();
                const copyControlledNodes = c.controlledNodes;

                let n1 = [];
                let n2 = [];
                let n3 = [];

                copyControlledNodes.filter(n => {
                    return n.name === node.name;
                }).forEach(node => {
                    let nodes = node.getFollowingNodes();
                    n1.push(...nodes);
                });

                copyControlledNodes.filter(n => {
                    return n.name === node2.name;
                }).forEach(node => {
                    let nodes = node.getFollowingNodes();
                    n2.push(...nodes);
                });

                copyControlledNodes.filter(n => {
                    return n.name === node3.name;
                }).forEach(node => {
                    let nodes = node.getFollowingNodes();
                    n3.push(...nodes);
                });

                chai.expect(c.controlledNodes).to.contain(node);
                chai.expect(n1).to.contain(node2)
                chai.expect(n2).to.contain(node3)
                chai.expect(n3).to.contain(node)
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


describe("Create Storage Element", function () {
    it('should add the message and store it in queue', function () {

        const name = "Node"
        const c = new Controller()
        let node = new MVCElement(name, c)

        let buffer = new ArrayBuffer(16)
        for (let i = 0; i < buffer.byteLength; i++) {
            buffer[i] = 1 + i
        }
        const randomTitle = "Random Title"
        node.addStorageElement(randomTitle,buffer)
        const elem = node.getLastStorageElememt()
        chai.expect(elem.title ).to.equal(randomTitle);
        chai.expect(elem.content ).to.equal(buffer);

    });
});
describe("Add Message", function () {
    it('should add the message and store it for later use', function () {
        let buffer = new ArrayBuffer(16)
        for (let i = 0; i < buffer.byteLength; i++) {
            buffer[i] = 1 + i
        }

        let m = new Message("Random Title", buffer)
        let c = prepareExchange(2);
        c.controlledNodes[0].sendMessage(m)

        chai.expect(CryptoUtil.ValidateSignature(public0, signedPublic0By2, public2)).to.be.true;
        chai.expect(CryptoUtil.ValidateSignature(public1, signedPublic1By0, public0)).to.be.true;
        chai.expect(CryptoUtil.ValidateSignature(public2, signedPublic2By1, public1)).to.be.true;
    });
});


function prepareExchange(count: number): Controller {
    let c = new Controller();
    const name1 = "Node 1"
    let node = new MVCElement(name1, c)


    switch (count) {

        case 1:
            c.addMVCNode(node)
            break
        case 2:
            const name2 = "Node 2"
            let node2 = new MVCElement(name2, c)
            c.addMVCNode(node)
            c.addMVCNode(node2)
            break
        case 3:
            const name3 = "Node 3"
            let node3 = new MVCElement(name3, c)
            c.addMVCNode(node)
            c.addMVCNode(node2)
            c.addMVCNode(node3)
            defaut:
                ;
    }

    c.assignNeighbours();
    for (let i = 0; i < c.controlledNodes.length; i++) {
        c.controlledNodes[i].initExchange()
    }
    return c
}