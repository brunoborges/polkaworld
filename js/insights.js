export const ESTIMATED_FLIGHT_SPEED_KMH = 800;
const EARTH_RADIUS_KM = 6371.0088;
const KM_PER_MILE = 1.609344;

export function greatCircleDistanceKm(from, to) {
  const radians = (degrees) => degrees * Math.PI / 180;
  const latitudeDelta = radians(to.lat - from.lat);
  const longitudeDelta = radians(to.lon - from.lon);
  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(radians(from.lat)) * Math.cos(radians(to.lat))
    * Math.sin(longitudeDelta / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(Math.min(1, Math.max(0, haversine))));
}

export function estimateTour(stops) {
  let distanceKm = 0;
  // The animation loops, but the travel estimate ends at the final event.
  for (let i = 1; i < stops.length; i++) {
    distanceKm += greatCircleDistanceKm(stops[i - 1], stops[i]);
  }
  return {
    totalStops: stops.length,
    distanceKm,
    distanceMiles: distanceKm / KM_PER_MILE,
    flightHours: distanceKm / ESTIMATED_FLIGHT_SPEED_KMH,
  };
}
