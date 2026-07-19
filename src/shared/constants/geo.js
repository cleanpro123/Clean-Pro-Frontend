// Qatar service-area geofence. Clean Pro only operates inside Qatar, so an
// order can only be confirmed when the pickup address falls within the country.
// We test the address coordinates against an approximate outline of Qatar
// (ray-casting point-in-polygon) rather than a plain bounding box, so points
// just across the border in Saudi Arabia — or out over the Gulf toward Bahrain
// — are correctly rejected. Coordinates are decimal degrees, [lat, lng].

// Cheap bounding box for an early-out before the polygon test.
export const QATAR_BOUNDS = {
  minLat: 24.4,
  maxLat: 26.25,
  minLng: 50.7,
  maxLng: 51.7,
};

// Approximate boundary of Qatar, walking the coastline and the southern land
// border with Saudi Arabia. Deliberately a touch generous on the coast so real
// coastal addresses (Doha, Al Wakrah, Lusail, Al Khor, Al Ruwais) are never
// excluded. Each vertex is [lat, lng].
const QATAR_POLYGON = [
  [24.56, 50.8], // SW — Saudi land border (Salwa side)
  [25.1, 50.74], // west coast
  [25.45, 50.76], // Dukhan / Zekreet
  [25.7, 50.82],
  [26.0, 51.05], // NW
  [26.18, 51.26], // northern tip (Ras Rakan)
  [26.1, 51.46],
  [25.92, 51.62], // NE — Ras Laffan
  [25.7, 51.56], // Al Khor
  [25.3, 51.64], // Doha coast (east)
  [25.0, 51.62], // Mesaieed
  [24.7, 51.46], // SE — Khor Al Adaid
  [24.55, 51.24],
  [24.47, 50.98], // southern border
  [24.5, 50.84],
];

// Standard ray-casting point-in-polygon. x = lng, y = lat.
function pointInPolygon(lat, lng, poly) {
  const x = lng;
  const y = lat;
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][1];
    const yi = poly[i][0];
    const xj = poly[j][1];
    const yj = poly[j][0];
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

// True when both coordinates are present and finite. Callers use this to tell a
// "location not set" address apart from one that is genuinely outside Qatar.
export function hasCoordinates(lat, lng) {
  return Number.isFinite(lat) && Number.isFinite(lng);
}

// True only when the coordinate pair is a valid point PROVABLY inside Qatar.
// Missing/invalid coordinates return `false` — an address with no saved
// location cannot be confirmed as inside the service area, so it is blocked.
export function isInsideQatar(lat, lng) {
  if (!hasCoordinates(lat, lng)) {
    return false;
  }
  if (
    lat < QATAR_BOUNDS.minLat ||
    lat > QATAR_BOUNDS.maxLat ||
    lng < QATAR_BOUNDS.minLng ||
    lng > QATAR_BOUNDS.maxLng
  ) {
    return false;
  }
  return pointInPolygon(lat, lng, QATAR_POLYGON);
}

// India service area. A plain bounding box over mainland India (plus the
// islands are close enough for this coarse check) — good enough to let orders
// placed from within India through, without a precise national polygon.
export const INDIA_BOUNDS = {
  minLat: 6.5,
  maxLat: 35.7,
  minLng: 68.1,
  maxLng: 97.4,
};

// True when the coordinate pair is a valid point inside India's bounding box.
export function isInsideIndia(lat, lng) {
  if (!hasCoordinates(lat, lng)) {
    return false;
  }
  return (
    lat >= INDIA_BOUNDS.minLat &&
    lat <= INDIA_BOUNDS.maxLat &&
    lng >= INDIA_BOUNDS.minLng &&
    lng <= INDIA_BOUNDS.maxLng
  );
}

// The app currently serves Qatar and India. An order can be placed when the
// pickup address falls inside either. Add more countries here as they launch.
export function isInsideServiceArea(lat, lng) {
  return isInsideQatar(lat, lng) || isInsideIndia(lat, lng);
}
