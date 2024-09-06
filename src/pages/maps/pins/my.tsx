import { Location, LocationConsumer } from "@prisma/client";
import { useModal } from "~/components/hooks/use-modal-store";
import { Button } from "~/components/shadcn/ui/button";
import { api } from "~/utils/api";

export default function Page() {
  return (
    <div>
      <ConsumedPins />
    </div>
  );
}

function ConsumedPins() {
  const consumedPins = api.maps.pin.getAUserConsumedPin.useQuery();
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
  const { onOpen } = useModal();
  return (
    <tr key={pin.id}>
      <th>{}</th>
      <td>{pin.createdAt.toDateString()}</td>
      <td>{location.title}</td>
      <td>
        <ClaimButton />
      </td>
    </tr>
  );

  function ClaimButton() {
    if (pin.claimedAt) {
      return (
        <Button className=" md:w-1/4" disabled>
          Claimed
        </Button>
      );
    } else if (location.assetId ?? location.pageAsset) {
      return (
        <Button
          variant="destructive"
          className="px-6 font-bold md:w-1/4"
          onClick={() =>
            onOpen("claim pin", {
              location: location,
              locationConsumer: pin,
            })
          }
        >
          Claim
        </Button>
      );
    } else {
      return <p>Not claimable</p>;
    }
  }
}
