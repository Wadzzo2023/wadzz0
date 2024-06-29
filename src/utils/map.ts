interface Location {
  latitude: number;
  longitude: number;
}

const EarthRadius = 6371; // Earth's radius in kilometers
const OneDegree = ((EarthRadius * 2 * Math.PI) / 360) * 1000; // One degree in meters

function randomPointInDisk(radius: number): [number, number] {
  const r = radius * Math.sqrt(Math.random());
  const theta = Math.random() * 2 * Math.PI;
  return [r * Math.cos(theta), r * Math.sin(theta)];
}

export function randomLocation(
  lat: number,
  lng: number,
  radius: number,
): Location {
  if (radius <= 0) return { latitude: lat, longitude: lng };
  const [dx, dy] = randomPointInDisk(radius);

  const randomLat = lat + dy / OneDegree;
  const randomLng = lng + dx / (OneDegree * Math.cos((lat * Math.PI) / 180));

  return {
    latitude: randomLat,
    longitude: randomLng,
  };
}
