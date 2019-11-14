export function calculateHours(containerDestinations: string[]) {
  containerDestinations.forEach(containerDestination => {
    if (containerDestination !== 'A' && containerDestination !== 'B') {
      throw new Error('Container destination must be either A or B');
    }
  });

  return -999;
}
