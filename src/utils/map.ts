interface Location {
  latitude: number;
  longitude: number;
}
export function getLocationInLatLngRad(
  radiusInMeters: number,
  currentLocation: Location,
): Location {
  const x0 = currentLocation.longitude;
  const y0 = currentLocation.latitude;

  const radiusInDegrees = radiusInMeters / 111320;

  const u = Math.random();
  const v = Math.random();
  const w = radiusInDegrees * Math.sqrt(u);
  const t = 2 * Math.PI * v;

  const x = w * Math.cos(t);
  const y = w * Math.sin(t);

  const new_x = x / Math.cos((y0 * Math.PI) / 180);

  const foundLatitude = y0 + y;
  const foundLongitude = x0 + new_x;

  return {
    latitude: foundLatitude,
    longitude: foundLongitude,
  };
}
