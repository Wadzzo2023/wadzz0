/**
 * Utility functions for geographical calculations
 */

/**
 * Calculate the distance between two coordinates using the Haversine formula
 * @param lat1 Latitude of the first point
 * @param lon1 Longitude of the first point
 * @param lat2 Latitude of the second point
 * @param lon2 Longitude of the second point
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  // Convert latitude and longitude from degrees to radians
  const radLat1 = (Math.PI * lat1) / 180;
  const radLon1 = (Math.PI * lon1) / 180;
  const radLat2 = (Math.PI * lat2) / 180;
  const radLon2 = (Math.PI * lon2) / 180;

  // Haversine formula
  const dLat = radLat2 - radLat1;
  const dLon = radLon2 - radLon1;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(radLat1) *
      Math.cos(radLat2) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // Earth radius in kilometers
  const R = 6371;

  // Distance in kilometers
  return R * c;
}

/**
 * Find the nearest location to the given coordinates
 * @param userLat User's latitude
 * @param userLng User's longitude
 * @param locations Array of locations
 * @returns The nearest location and its distance
 */
export function findNearestLocation(
  userLat: number,
  userLng: number,
  locations: Array<{
    latitude: number;
    longitude: number;
    id: string | number;
    [key: string]: any;
  }>,
): { location: any; distance: number } | null {
  if (!locations || locations.length === 0) {
    return null;
  }

  let nearestLocation = locations[0];
  let minDistance = calculateDistance(
    userLat,
    userLng,
    nearestLocation?.latitude ?? 0,
    nearestLocation?.longitude ?? 0,
  );

  for (const location of locations) {
    const distance = calculateDistance(
      userLat,
      userLng,
      location.latitude,
      location.longitude,
    );

    if (distance < minDistance) {
      minDistance = distance;
      nearestLocation = location;
    }
  }

  return {
    location: nearestLocation,
    distance: minDistance,
  };
}
