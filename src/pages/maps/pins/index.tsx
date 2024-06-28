import { Location, LocationConsumer } from "@prisma/client";
import React from "react";
import ClaimPinModal from "~/components/maps/claim/modal";
import { api } from "~/utils/api";

export default function Page() {
  return (
    <div>
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
      <div>
        <div className="overflow-x-auto">
          <table className="table table-zebra">
            {/* head */}
            <thead>
              <tr>
                <th></th>
                <th>Pubkey</th>
                <th>Joined At</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {consumedPins.data.map((pin) => {
                return (
                  <ClaimConsumedPin
                    key={pin.id}
                    pin={pin}
                    location={pin.location}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
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
    <tr key={pin.id}>
      <th>{pin.id}</th>
      <td>
        {location.assetId && location.claimAmount ? (
          <ClaimPinModal location={location} />
        ) : (
          <p>Not claimable</p>
        )}
      </td>
      <td>{pin.userId}</td>
      <td></td>
    </tr>
  );
}
