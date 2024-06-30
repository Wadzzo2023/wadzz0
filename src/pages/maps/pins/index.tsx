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
                <th>Collected At</th>
                <th>Pin title</th>
                <th>Status</th>
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
  console.log(location);
  return (
    <tr key={pin.id}>
      <th>{}</th>
      <td>{pin.createdAt.toDateString()}</td>
      <td>{location.title}</td>
      <td>
        <Button />
      </td>
    </tr>
  );

  function Button() {
    if (pin.claimedAt) {
      return (
        <button className="btn btn-disabled btn-sm" disabled>
          Claimed
        </button>
      );
    } else if (location.assetId ?? location.pageAsset) {
      return <ClaimPinModal consume={pin} location={location} />;
    } else {
      return <p>Not claimable</p>;
    }
  }
}
