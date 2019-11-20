export function calculateHours(containerDestinations: string[]) {
  containerDestinations.forEach(containerDestination => {
    if (containerDestination !== 'A' && containerDestination !== 'B') {
      throw new Error('Container destination must be either A or B');
    }
  });

  let totalHours = 0;

  const containers = containerDestinations.map(c => new Container(c));
  const factory = new Factory(containers);
  const port = new Port('Port');
  const warehouseA = new Warehouse('Warehouse A');
  const warehouseB = new Warehouse('Warehouse B');
  const truckOne = new Truck();
  const truckTwo = new Truck();
  const ship = new Ship();

  const factoryBRoute = new Route(factory, warehouseB, 5);
  const factoryPortRoute = new Route(factory, port, 1);
  const portARoute = new Route(port, warehouseA, 4);

  let currentTrips: Trip[] = [];

  const log = (message: string) => console.log(` ${totalHours.toString().padStart(2, '0')}: ${message}`);

  while (true) {
    let truckOneTrip = currentTrips.find(t => t.transporter === truckOne);
    let truckTwoTrip = currentTrips.find(t => t.transporter === truckTwo);
    let shipTrip = currentTrips.find(t => t.transporter === ship);

    if (!truckOneTrip) {
      log('Truck one has no trip');
      // assume at factory?
      if (factory.containers.length) {
        const nextContainer = factory.containers.shift()!;
        truckOne.setContainer(nextContainer);

        if (nextContainer.destination === 'B') {
          truckOneTrip = new Trip(factoryBRoute, truckOne);
        } else {
          // assume A
          truckOneTrip = new Trip(factoryPortRoute, truckOne);
        }

        log(`Truck one picked up container from factory with destination ${nextContainer.destination}`);

        currentTrips.push(truckOneTrip);
      }
    }

    if (!truckTwoTrip) {
      log('Truck two has no trip');
      // assume at factory?
      if (factory.containers.length) {
        const nextContainer = factory.containers.shift()!;
        truckTwo.setContainer(nextContainer);

        if (nextContainer.destination === 'B') {
          truckTwoTrip = new Trip(factoryBRoute, truckTwo);
        } else {
          // assume A
          truckTwoTrip = new Trip(factoryPortRoute, truckTwo);
        }

        log(`Truck two picked up container from factory with destination ${nextContainer.destination}`);

        currentTrips.push(truckTwoTrip);
      }
    }

    if (!shipTrip) {
      log('Ship has no trip');
      // assume at port?
      if (port.containers.length) {
        const nextContainer = port.containers.shift()!;
        ship.setContainer(nextContainer);

        if (nextContainer.destination !== 'A') {
          // Error
          throw new Error('Wrong destination');
        }

        log(`Ship picked up container from port with destination ${nextContainer.destination}`);

        shipTrip = new Trip(portARoute, ship)
        currentTrips.push(shipTrip);
      }
    }

    totalHours += 1;
    truckOneTrip && truckOneTrip.advanceHour();
    truckTwoTrip && truckTwoTrip.advanceHour();
    shipTrip && shipTrip.advanceHour();

    if (truckOneTrip && truckOneTrip.isComplete) {
        log(`Truck one trip to ${truckOneTrip.route.end} is complete`);
      if (truckOne.container !== null) {
        log(`Truck one dropped off container with destination ${truckOne.container.destination}`);
        truckOneTrip.route.end.addContainer(truckOne.container);
        truckOne.container = null;
      }

      if (truckOneTrip.route.end !== factory) {
        log(`Truck one returning to ${truckOneTrip.route.start}`);
        currentTrips.push(truckOneTrip.reverse());
      }

      currentTrips = currentTrips.filter(t => t !== truckOneTrip);
    }

    if (truckTwoTrip && truckTwoTrip.isComplete) {
      log(`Truck two trip to ${truckTwoTrip.route.end} is complete`);
      if (truckTwo.container !== null) {
        log(`Truck two dropped off container with destination ${truckTwo.container.destination}`);
        truckTwoTrip.route.end.addContainer(truckTwo.container);
        truckTwo.container = null;
      }

      if (truckTwoTrip.route.end !== factory) {
        log(`Truck two returning to ${truckTwoTrip.route.start}`);
        currentTrips.push(truckTwoTrip.reverse());
      }

      currentTrips = currentTrips.filter(t => t !== truckTwoTrip);
    }

    if (shipTrip && shipTrip.isComplete) {
      log(`Ship trip to ${shipTrip.route.end} is complete`);
      if (ship.container !== null) {
        log(`Ship dropped off container with destination ${ship.container.destination}`);
        shipTrip.route.end.addContainer(ship.container);
        ship.container = null;
      }

      if (shipTrip.route.end !== port) {
        log(`Ship returning to ${shipTrip.route.start}`);
        currentTrips.push(shipTrip.reverse());
      }

      currentTrips = currentTrips.filter(t => t !== shipTrip);
    }

    const allDelivered = containers.every(c => warehouseA.containers.includes(c) || warehouseB.containers.includes(c));

    log('Status:');
    log(` Containers at A:    ${warehouseA.containers.length}`);
    log(` Containers at B:    ${warehouseA.containers.length}`);
    log(` Containers at Port: ${warehouseA.containers.length}`);
    log(` All delivered:      ${allDelivered ? 'Yes' : 'No'}`);

    if (allDelivered) {
      break;
    }

    if (totalHours > 100) {
      log('Error: Possible Timeout?');
      break;
    }
  }

  return totalHours;
}

class Container {
  constructor(public destination: string) {
  }

  toString() {
    return `Container to destination ${this.destination}`;
  }
}

abstract class ContainerStore {
  containers: Container[] = [];

  constructor(private name: string) {}

  addContainer(container: Container) {
    this.containers.push(container);
  }

  toString() {
    return this.name;
  }
}

class Factory extends ContainerStore {
  constructor(public containers: Container[]) {
    super('Factory');
    this.containers = [...containers];
  }
}

class Warehouse extends ContainerStore {

}

class Port extends ContainerStore {

}

abstract class Transporter {
  public container: Container | null = null;

  setContainer(container: Container) {
    if (this.container) {
      throw new Error('Already have a container');
    }

    this.container = container;
  }
}

class Truck extends Transporter { }
class Ship extends Transporter { }


class Route {
  constructor(public start: ContainerStore, public end: ContainerStore, public hours: number) {

  }
}

class Trip {
  private currentHours: number;
  private _isComplete: boolean;

  get isComplete(): boolean {
    return this._isComplete;
  }

  constructor(public route: Route, public transporter: Transporter) {
    this.currentHours = 0;
    this._isComplete = false;
  }

  public reverse() {
    return new Trip(new Route(this.route.end, this.route.start, this.route.hours), this.transporter);
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
