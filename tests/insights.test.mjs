import test from 'node:test';
import assert from 'node:assert/strict';
import { estimateTour, greatCircleDistanceKm } from '../js/insights.js';
import { TOUR } from '../js/tour.js';

test('great-circle distances handle identical, nearby, and antipodal stops', () => {
  const origin = { lat: 0, lon: 0 };
  assert.equal(greatCircleDistanceKm(origin, origin), 0);
  assert.ok(Math.abs(greatCircleDistanceKm(origin, { lat: 0, lon: 1 }) - 111.195) < 0.001);
  assert.ok(Math.abs(greatCircleDistanceKm(origin, { lat: 0, lon: 180 }) - 20015.114) < 0.001);
  assert.ok(greatCircleDistanceKm({ lat: 0, lon: 179 }, { lat: 0, lon: -179 }) < 223);
});

test('estimates include consecutive legs, not a return trip or duplicate-city mileage', () => {
  const a = { lat: 0, lon: 0 };
  const b = { lat: 0, lon: 1 };
  const result = estimateTour([a, a, b]);
  assert.equal(result.totalStops, 3);
  assert.equal(result.distanceKm, greatCircleDistanceKm(a, b));
  assert.equal(result.distanceMiles, result.distanceKm / 1.609344);
  assert.equal(result.flightHours, result.distanceKm / 800);
  assert.equal(estimateTour([]).distanceKm, 0);
  assert.equal(estimateTour([a]).flightHours, 0);
});

test('official tour totals stay within independently calculated route bounds', () => {
  const result = estimateTour(TOUR);
  const radians = (degrees) => degrees * Math.PI / 180;
  let independentKm = 0;
  for (let i = 1; i < TOUR.length; i++) {
    const a = TOUR[i - 1];
    const b = TOUR[i];
    const cosine = Math.sin(radians(a.lat)) * Math.sin(radians(b.lat))
      + Math.cos(radians(a.lat)) * Math.cos(radians(b.lat)) * Math.cos(radians(b.lon - a.lon));
    independentKm += 6371.0088 * Math.acos(Math.max(-1, Math.min(1, cosine)));
  }
  assert.equal(result.totalStops, 34);
  assert.ok(Math.abs(result.distanceKm - independentKm) < 0.01);
  assert.ok(result.distanceKm > 40000 && result.distanceKm < 100000);
});
