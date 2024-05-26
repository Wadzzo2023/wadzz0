import {
  APIProvider,
  AdvancedMarker,
  Map,
  MapMouseEvent,
  Marker,
} from "@vis.gl/react-google-maps";
import Image from "next/image";
import React, { useState } from "react";
import { Avatar, Loading } from "react-daisyui";
import toast from "react-hot-toast";
import CreatePinModal from "~/components/maps/modals/create-pin";
import { api } from "~/utils/api";

function App() {
  const modal = React.useRef<HTMLDialogElement>(null);
  const [clickedPos, updatePos] = useState<google.maps.LatLngLiteral>();

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
        mapId={"bf51eea910020fa25a"}
        style={{ height: "100vh" }}
        defaultCenter={{ lat: 22.54992, lng: 0 }}
        defaultZoom={3}
        gestureHandling={"greedy"}
        disableDefaultUI={true}
      >
        <MyPins />
      </Map>
      {clickedPos && <CreatePinModal modal={modal} position={clickedPos} />}
    </APIProvider>
  );
}

function MyPins() {
  const pins = api.maps.pin.getMyPins.useQuery();

  if (pins.isLoading) return <Loading />;

  if (pins.data) {
    return (
      <>
        {pins.data.map((pin) => (
          <AdvancedMarker
            key={pin.id}
            position={{ lat: pin.latitude, lng: pin.longitude }}
          >
            {/* <span className="tree">🌳</span> */}
            <span>
              <Image
                src="/favicon.ico"
                width={30}
                height={30}
                alt="vong cong"
              />
            </span>
          </AdvancedMarker>
        ))}
      </>
    );
  }
}

export default App;
