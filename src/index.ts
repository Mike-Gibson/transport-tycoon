import { argv } from 'yargs';
import { calculateHours } from './core';

const containerDestinationString = argv.containerDestinations as unknown as string;

if (!containerDestinationString) {
  console.error('Must provide --containerDestinations command line argument');
}

const containerDestinations = containerDestinationString.split('');

console.log(`Calculating hours for ${containerDestinations}`);

const hours = calculateHours(containerDestinations);

console.log(`Hours: ${hours}`);
