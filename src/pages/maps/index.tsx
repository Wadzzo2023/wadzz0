import {
  APIProvider,
  Map,
  MapMouseEvent,
  Marker,
} from "@vis.gl/react-google-maps";
import toast from "react-hot-toast";

function App() {
  const positions = [
    { lat: 61.2176, lng: -149.8997 },
    // suggest random positions
    { lat: 41.2176, lng: -14.8997 },
    { lat: 21.2176, lng: -19.8997 },
    { lat: 51.2176, lng: -9.8997 },
    { lat: 61.2176, lng: -19.8997 },
    { lat: 61.2176, lng: -9.8997 },
    { lat: 61.2176, lng: -19.8997 },
    { lat: 61.2176, lng: -9.8997 },
    { lat: 61.2176, lng: -19.8997 },
    { lat: 61.2176, lng: -9.8997 },
    { lat: 61.2176, lng: -19.8997 },
    { lat: 61.2176, lng: -9.8997 },
    { lat: 61.2176, lng: -19.8997 },
    { lat: 61.2176, lng: -9.8997 },
    { lat: 61.2176, lng: -19.8997 },
    { lat: 61.2176, lng: -9.8997 },
    { lat: 61.2176, lng: -19.8997 },
    { lat: 61.2176, lng: -9.8997 },
    { lat: 61.2176, lng: -19.8997 },
    { lat: 61.2176, lng: -9.8997 },
    { lat: 61.2176, lng: -19.8997 },
    { lat: 61.2176, lng: -9.8997 },
    { lat: 61.2176, lng: -19.8997 },
    { lat: 61.2176, lng: -9.8997 },
    { lat: 61.2176, lng: -19.8997 },
    { lat: 61.2176, lng: -9.8997 },
    { lat: 61.2176, lng: -19.8997 },
    { lat: 61.2176, lng: -9.8997 },
  ];

  function handleMapClick(event: MapMouseEvent): void {
    const position = event.detail.latLng;
    if (position) {
      const lat = position.lat.toPrecision(3);
      toast.success(
        `Latitude: ${position.lat.toPrecision(5)}, Longitude: ${position.lng.toPrecision(5)}`,
      );
    }
  }

  return (
    <APIProvider apiKey={"AIzaSyDoSm4IfpYtHLnCBnXsH6f47t6hLdAnyao"}>
      <Map
        onClick={handleMapClick}
        // center={position}
        // zoom={100}
        style={{ height: "100vh" }}
        defaultCenter={{ lat: 22.54992, lng: 0 }}
        defaultZoom={3}
        gestureHandling={"greedy"}
        disableDefaultUI={true}
      >
        {positions.map((position, index) => (
          <Marker key={index} position={position} />
        ))}
      </Map>
    </APIProvider>
  );
}

export default App;
