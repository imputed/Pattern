class Observed {
  static getInstance() {
    if (Observed.Instance === undefined) {
      Observed.Instance = new Observed("Static Observed");
    }

    return Observed.Instance;
  }

  #handlers;

  constructor(name) {
    this.#handlers = [];
    this.name = name;
  }

  subscribe(o) {
    this.#handlers.push(o);
  }

  unsubscribe(o) {
    this.#handlers = this.#handlers.filter(handler => {
      return o.name === handler.name;
    });
  }

  fireEvent() {
    this.#handlers.forEach(item => {
      item.fire(Observed.getInstance());
    });
  }

  fire(obj) {
    console.log("Observer fired from " + obj.name);
  }

}

class Index {
  constructor(name) {
    this.name = name;
  }

  fire(obj) {
    console.log("Fired at: " + this.name + " from " + obj.name);
    obj.fire(this);
  }

}

let o;

for (let i = 0; i < 1000; i++) {
  o = new Index("Item " + i.toString());
  Observed.getInstance().subscribe(o);
}

Observed.getInstance().fireEvent();