import {
  APIProvider,
  AdvancedMarker,
  Map,
  MapMouseEvent,
} from "@vis.gl/react-google-maps";
import { MapPin, Pin } from "lucide-react";
import Image from "next/image";
import React, { useState } from "react";
import { Loading } from "react-daisyui";
import toast from "react-hot-toast";
import { useModal } from "~/components/hooks/use-modal-store";
import CreatePinModal from "~/components/maps/modals/create-pin";
// import { PlacesAutocomplete } from "~/components/maps/place";
import { useCreatorStorageAcc } from "~/lib/state/wallete/stellar-balances";
import { api } from "~/utils/api";

function App() {
  const modal = React.useRef<HTMLDialogElement>(null);
  const [clickedPos, updatePos] = useState<google.maps.LatLngLiteral>();
  const [manual, setManual] = useState<boolean>();
  const { setBalance } = useCreatorStorageAcc();
  const { onOpen, isPinCopied, data } = useModal();

  // queries
  const acc = api.wallate.acc.getCreatorStorageBallances.useQuery(undefined, {
    onSuccess: (data) => {
      // console.log(data);
      setBalance(data);
    },
    onError: (error) => {
      console.log(error);
    },
    refetchOnWindowFocus: false,
  });

  function handleMapClick(event: MapMouseEvent): void {
    setManual(false);
    const position = event.detail.latLng;
    if (position) {
      updatePos(position);
      if (!isPinCopied) {
        modal.current?.showModal();
      } else {
        onOpen("copied", {
          long: position.lng,
          lat: position.lat,
          pinId: data.pinId,
        });
      }
    }
  }

  function handleManualPinClick() {
    setManual(true);
    updatePos(undefined);
    modal.current?.showModal();
  }

  return (
    <APIProvider apiKey={"AIzaSyDoSm4IfpYtHLnCBnXsH6f47t6hLdAnyao"}>
      {/* <PlacesAutocomplete /> */}
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
      <ManualPinButton handleClick={handleManualPinClick} />
      {(clickedPos ?? manual) && (
        <CreatePinModal modal={modal} position={clickedPos} manual={manual} />
      )}
    </APIProvider>
  );

  function ManualPinButton({ handleClick }: { handleClick: () => void }) {
    return (
      <div className="absolute bottom-2 right-2">
        <div className="btn btn-circle" onClick={handleClick}>
          <MapPin />
        </div>
      </div>
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
              onClick={() => onOpen("map", { pinId: pin.id })}
            >
              {pin._count.consumers < pin.limit ? (
                <span className="tree">(🌳)</span>
              ) : (
                <span>
                  <Image
                    src={pin.creator.profileUrl ?? "/favicon.ico"}
                    width={30}
                    height={30}
                    alt="vong cong"
                  />
                </span>
              )}
            </AdvancedMarker>
          ))}
        </>
      );
    }
  }
}
export default App;
