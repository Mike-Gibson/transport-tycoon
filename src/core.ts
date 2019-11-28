enum EventType {
  Arrive = 'ARRIVE',
  Depart = 'DEPART',
}

enum TransportKind {
  Truck = 'TRUCK',
  Ship = 'SHIP',
}

type LogEntry = {
  event: EventType,
  time: number,
  transport_id: number,
  kind: TransportKind,
  location: string,
  destination: string,
  cargo: { cargo_id: number, destination: string, origin: string }[],
}

export function calculateHours(containerDestinations: string[], debug: boolean = false, noEvents: boolean = false) {
  containerDestinations.forEach(containerDestination => {
    if (containerDestination !== 'A' && containerDestination !== 'B') {
      throw new Error('Container destination must be either A or B');
    }
  });

  let totalHours = 0;

  const containers = containerDestinations.map((c, index) => new Container(index, c));
  const factory = new Factory(containers);
  const port = new Port('PORT');
  const warehouseA = new Warehouse('A');
  const warehouseB = new Warehouse('B');
  const truckOne = new Truck(0);
  const truckTwo = new Truck(1);
  const ship = new Ship(2);

  const factoryBRoute = new Route(factory, warehouseB, 5);
  const factoryPortRoute = new Route(factory, port, 1);
  const portARoute = new Route(port, warehouseA, 4);

  let currentTrips: Trip[] = [];

  const logDebug = (message: string) => debug && console.log(` ${totalHours.toString().padStart(2, '0')}: ${message}`);
  const logEvent = (event: EventType, trip: Trip) => {
    if (noEvents) {
      return;
    }

    const from = event === EventType.Depart ? trip.route.start : trip.route.end;
    const to = event === EventType.Depart ? trip.route.end : trip.route.start;
    const container = trip.transporter.container;
    const cargo = container === null
      ? []
      : [{ cargo_id: container.id, destination: container.destination, origin: factory.toString() }]; // TODO: Hard coded origin

    const entry: LogEntry = {
      event: event,
      time: totalHours,
      transport_id: trip.transporter.id,
      kind: trip.transporter.kind,
      location: from.toString(),
      destination: to.toString(),
      cargo: cargo,
    };

    console.log(JSON.stringify(entry));
  };

  while (true) {
    let truckOneTrip = currentTrips.find(t => t.transporter === truckOne);
    let truckTwoTrip = currentTrips.find(t => t.transporter === truckTwo);
    let shipTrip = currentTrips.find(t => t.transporter === ship);

    if (!truckOneTrip) {
      logDebug('Truck one has no trip');
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

        logDebug(`Truck one picked up container from factory with destination ${nextContainer.destination}`);
        logEvent(EventType.Depart, truckOneTrip);

        currentTrips.push(truckOneTrip);
      }
    }

    if (!truckTwoTrip) {
      logDebug('Truck two has no trip');
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

        logDebug(`Truck two picked up container from factory with destination ${nextContainer.destination}`);
        logEvent(EventType.Depart, truckTwoTrip);

        currentTrips.push(truckTwoTrip);
      }
    }

    if (!shipTrip) {
      logDebug('Ship has no trip');
      // assume at port?
      if (port.containers.length) {
        const nextContainer = port.containers.shift()!;
        ship.setContainer(nextContainer);

        if (nextContainer.destination !== 'A') {
          // Error
          throw new Error('Wrong destination');
        }

        shipTrip = new Trip(portARoute, ship)

        logDebug(`Ship picked up container from port with destination ${nextContainer.destination}`);
        logEvent(EventType.Depart, shipTrip);

        currentTrips.push(shipTrip);
      }
    }

    totalHours += 1;
    truckOneTrip && truckOneTrip.advanceHour();
    truckTwoTrip && truckTwoTrip.advanceHour();
    shipTrip && shipTrip.advanceHour();

    if (truckOneTrip && truckOneTrip.isComplete) {
      logDebug(`Truck one trip to ${truckOneTrip.route.end} is complete`);
      logEvent(EventType.Arrive, truckOneTrip);

      if (truckOne.container !== null) {
        logDebug(`Truck one dropped off container with destination ${truckOne.container.destination}`);
        truckOneTrip.route.end.addContainer(truckOne.container);
        truckOne.container = null;
      }

      if (truckOneTrip.route.end !== factory) {
        logDebug(`Truck one returning to ${truckOneTrip.route.start}`);
        const returnTrip = truckOneTrip.reverse();
        logEvent(EventType.Depart, returnTrip);
        currentTrips.push(returnTrip);
      }

      currentTrips = currentTrips.filter(t => t !== truckOneTrip);
    }

    if (truckTwoTrip && truckTwoTrip.isComplete) {
      logDebug(`Truck two trip to ${truckTwoTrip.route.end} is complete`);
      logEvent(EventType.Arrive, truckTwoTrip);
      
      if (truckTwo.container !== null) {
        logDebug(`Truck two dropped off container with destination ${truckTwo.container.destination}`);
        truckTwoTrip.route.end.addContainer(truckTwo.container);
        truckTwo.container = null;
      }

      if (truckTwoTrip.route.end !== factory) {
        logDebug(`Truck two returning to ${truckTwoTrip.route.start}`);
        const returnTrip = truckTwoTrip.reverse();
        logEvent(EventType.Depart, returnTrip);
        currentTrips.push(returnTrip);
      }

      currentTrips = currentTrips.filter(t => t !== truckTwoTrip);
    }

    if (shipTrip && shipTrip.isComplete) {
      logDebug(`Ship trip to ${shipTrip.route.end} is complete`);
      logEvent(EventType.Arrive, shipTrip);

      if (ship.container !== null) {
        logDebug(`Ship dropped off container with destination ${ship.container.destination}`);
        shipTrip.route.end.addContainer(ship.container);
        ship.container = null;
      }

      if (shipTrip.route.end !== port) {
        logDebug(`Ship returning to ${shipTrip.route.start}`);
        const returnTrip = shipTrip.reverse();
        logEvent(EventType.Depart, returnTrip);
        currentTrips.push(returnTrip);
      }

      currentTrips = currentTrips.filter(t => t !== shipTrip);
    }

    const allDelivered = containers.every(c => warehouseA.containers.includes(c) || warehouseB.containers.includes(c));

    logDebug('Status:');
    logDebug(` Containers at A:    ${warehouseA.containers.length}`);
    logDebug(` Containers at B:    ${warehouseA.containers.length}`);
    logDebug(` Containers at Port: ${warehouseA.containers.length}`);
    logDebug(` All delivered:      ${allDelivered ? 'Yes' : 'No'}`);

    if (allDelivered) {
      break;
    }

    if (totalHours > 100) {
      console.error('Error: Possible Timeout?');
      break;
    }
  }

  return totalHours;
}

class Container {
  readonly id: number;

  constructor(id: number, public destination: string) {
    this.id = id;
  }

  toString() {
    return `Container to destination ${this.destination}`;
  }
}

abstract class ContainerStore {
  containers: Container[] = [];

  constructor(private name: string) { }

  addContainer(container: Container) {
    this.containers.push(container);
  }

  toString() {
    return this.name;
  }
}

class Factory extends ContainerStore {
  constructor(public containers: Container[]) {
    super('FACTORY');
    this.containers = [...containers];
  }
}

class Warehouse extends ContainerStore {

}

class Port extends ContainerStore {

}

abstract class Transporter {
  public readonly id: number;
  public readonly kind: TransportKind;
  public container: Container | null = null;

  constructor(id: number, kind: TransportKind) {
    this.id = id;
    this.kind = kind;
  }

  setContainer(container: Container) {
    if (this.container) {
      throw new Error('Already have a container');
    }

    this.container = container;
  }
}

class Truck extends Transporter {
  constructor(id: number) {
    super(id, TransportKind.Truck);
  }
}

class Ship extends Transporter {
  constructor(id: number) {
    super(id, TransportKind.Ship);
  }
}


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
