import { Location, LocationConsumer } from "@prisma/client";
import React from "react";
import ClaimPinModal from "~/components/maps/claim/modal";
import { api } from "~/utils/api";

export default function Page() {
  return (
    <div>
      hover
      <ConsumedPins />
    </div>
  );
}

function ConsumedPins() {
  const consumedPins = api.maps.pin.getConsumedLocated.useQuery();
  if (consumedPins.isLoading) return <p>Loading...</p>;
  if (consumedPins.isError) return <p>Error</p>;

  return (
    <div>
      <ul>
        {consumedPins.data.map((pin) => {
          return (
            <ClaimConsumedPin key={pin.id} pin={pin} location={pin.location} />
          );
        })}
      </ul>
    </div>
  );
}

// TODO: claim pin
function ClaimConsumedPin({
  pin,
  location,
}: {
  pin: LocationConsumer;
  location: Location;
}) {
  return (
    <li>
      {pin.id}
      {location.assetId && location.claimAmount ? (
        <ClaimPinModal location={location} />
      ) : (
        <p>Not claimable</p>
      )}
    </li>
  );
}
