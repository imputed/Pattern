// @flow

class Observed implements ObserverInterface {
    static Instance: Observed
    static getInstance(){
        if (Observed.Instance === undefined){
            Observed.Instance = new Observed("Static Observed")
        }

        return Observed.Instance

    }

    #handlers: Array<ObserverInterface>
    name: string

    constructor(name: string) {
        this.#handlers = []
        this.name = name
    }

    subscribe(o: ObserverInterface): void {
        this.#handlers.push(o)
    }

    unsubscribe(o: ObserverInterface): void {
        this.#handlers = this.#handlers.filter(handler => {
            return (o.name === handler.name)
        })
    }

    fireEvent(): void {
        this.#handlers.forEach(item => {
            item.fire(Observed.getInstance())
        })
    }

    fire(obj: ObserverInterface): void{
        console.log("Observer fired from " + obj.name)
    }


}


class Index implements ObserverInterface {
    name: string
    constructor(name: string) {
        this.name = name
    }

    fire(obj: ObserverInterface): void{
        console.log("Fired at: " + this.name + " from " +obj.name)
        obj.fire(this)
    }
}

interface ObserverInterface {
    name: string,
    fire(obj: ObserverInterface): void
}


let o
for (let i = 0; i < 1000; i++) {
    o = new Index("Item " + i.toString())
    Observed.getInstance().subscribe(o)
}
Observed.getInstance().fireEvent()
