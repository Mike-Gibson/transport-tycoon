import { argv } from 'yargs';
import { calculateHours } from './core';

const containerDestinationString = argv.containerDestinations as unknown as string;
const debug = !!argv.debug;
const noEvents = !!argv.noEvents;

if (!containerDestinationString) {
  throw new Error('Must provide --containerDestinations command line argument');
}

const containerDestinations = containerDestinationString.split('');

console.log(`Calculating hours for ${containerDestinations}`);

const hours = calculateHours(containerDestinations, debug, noEvents);

console.log(`Hours: ${hours}`);
