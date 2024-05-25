import {
  APIProvider,
  Map,
  MapMouseEvent,
  Marker,
} from "@vis.gl/react-google-maps";
import React, { useState } from "react";
import toast from "react-hot-toast";
import CreatePinModal from "~/components/maps/modals/create-pin";

function App() {
  const modal = React.useRef<HTMLDialogElement>(null);
  const [clickedPos, updatePos] = useState<google.maps.LatLngLiteral>();
  const positions = [
    { lat: 61.2176, lng: -149.8997 },
    // suggest random positions
    { lat: 41.2176, lng: -14.8997 },
    { lat: 21.2176, lng: -19.8997 },

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
      updatePos(position);
      modal.current?.showModal();
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
      <CreatePinModal modal={modal} position={clickedPos} />
    </APIProvider>
  );
}

export default App;
