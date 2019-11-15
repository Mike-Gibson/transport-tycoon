export function calculateHours(containerDestinations: string[]) {
  containerDestinations.forEach(containerDestination => {
    if (containerDestination !== 'A' && containerDestination !== 'B') {
      throw new Error('Container destination must be either A or B');
    }

    const totalHours = 0;

    let complete = false;

    const containers = containerDestinations.map(c => new Container(c));
    const factory = new Factory(containers);
    const port = new Port();
    const warehouseA = new Warehouse();
    const warehouseB = new Warehouse();
    const truckOne = new Truck();
    const truckTwo = new Truck();
    const ship = new Ship();

    const factoryBRoute = new Route(factory, warehouseB, 5);
    const factoryPortRoute = new Route(factory, port, 1);
    const portBRoute = new Route(port, warehouseA, 4);

    

    while (!complete) {

    }
  });

  return -999;
}

class Container {
  constructor(public destination: string) {
  }
}

abstract class ContainerStore {
  containers: Container[] = [];

  addContainer(container: Container) {
    this.containers.push(container);
  }
}

class Factory extends ContainerStore {
  constructor(public containers: Container[]) {
    super();
    this.containers = containers;
  }
}

class Warehouse extends ContainerStore {

}

class Port extends ContainerStore {

}

abstract class Transporter {
  private container: Container | null = null;

  setContainer(container: Container) {
    if (this.container) {
      throw new Error('Already have a container');
    }

    this.container = container;
  } 
}

class Truck extends Transporter {}
class Ship extends Transporter {}


class Route {
  constructor(public start: ContainerStore, public end: ContainerStore, public hours: number) {

  }
}

class Trip {
  private currentHours: number;
  private _isComplete: boolean;

  get isComplete(): boolean {
    return this.isComplete;
  }

  constructor(private route: Route, public transporter: Transporter) {
    this.currentHours = 0;
    this._isComplete = false;
  }

  advanceHour() {
    if (this._isComplete) {
      throw new Error('Already complete');
    }
    
    this.currentHours += 1;

    if (this.currentHours === this.route.hours) {
      this._isComplete = true;
    }
  }
}
