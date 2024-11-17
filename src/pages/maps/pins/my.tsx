import { Location, LocationConsumer } from "@prisma/client";
import { formatDate } from "date-fns";
import Image from "next/image";
import { useModal } from "~/lib/state/play/use-modal-store";
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
  console.log(consumedPins);
  if (consumedPins.isLoading) return <p>Loading...</p>;
  if (consumedPins.isError) return <p>Error</p>;

  return (
    <div className=" overflow-x-auto p-4">
      <div className="inline-block min-w-full overflow-hidden rounded-lg shadow">
        <table className="min-w-full leading-normal">
          <thead>
            <tr>
              <th className="border-b-2 border-gray-200 bg-gray-100 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                Location
              </th>
              <th className="border-b-2 border-gray-200 bg-gray-100 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                Approve Status
              </th>
              <th className="border-b-2 border-gray-200 bg-gray-100 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                Closed At
              </th>
              <th className="border-b-2 border-gray-200 bg-gray-100 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                LAT | LNG
              </th>
              <th className="border-b-2 border-gray-200 bg-gray-100 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                Claim Status
              </th>
            </tr>
          </thead>
          <tbody>
            {consumedPins.data.map((pin, id) => {
              return (
                <ClaimConsumedPin key={id} pin={pin} location={pin.location} />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// TODO: claim pin
function ClaimConsumedPin({
  pin,
  location,
  key,
}: {
  pin: LocationConsumer;
  location: Location;
  key: number;
}) {
  const { onOpen } = useModal();
  return (
    <>
      <tr>
        <td className="border-b border-gray-200 bg-white px-5 py-5 text-sm">
          <div className="flex items-center">
            <div className="h-10 w-10 flex-shrink-0">
              <Image
                height={1000}
                width={1000}
                className="h-full w-full rounded-full object-contain"
                src={location.image ?? "/images/icons/wadzzo.svg"}
                alt=""
              />
            </div>
            <div className="ml-3">
              <p className="whitespace-no-wrap text-gray-900">
                {formatTitle(location.title)}
              </p>
            </div>
          </div>
        </td>
        <td className="border-b border-gray-200 bg-white px-5 py-5 text-sm">
          {location.approved ? (
            <span className="relative me-2 inline-block rounded border border-green-400 bg-green-100 px-2.5 py-0.5  text-xs font-medium leading-tight text-green-800 dark:bg-gray-700 dark:text-green-400">
              <span
                aria-hidden
                className="absolute inset-0 rounded-full bg-green-200 opacity-50"
              ></span>
              <span className="relative">Approved</span>
            </span>
          ) : (
            <span className="relative me-2  inline-block rounded  border   border-indigo-400 bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800 dark:bg-gray-700 dark:text-indigo-400">
              <span
                aria-hidden
                className="absolute inset-0 rounded-full bg-indigo-100 opacity-50"
              ></span>
              <span className="relative">Pending</span>
            </span>
          )}
        </td>
        <td className="border-b border-gray-200 bg-white px-5 py-5 text-sm">
          <p className="whitespace-no-wrap text-gray-900">
            {formatDate(new Date(location.endDate), "dd/MM/yyyy")}
          </p>
        </td>
        <td className="border-b border-gray-200 bg-white px-5 py-5 text-sm">
          <p className="whitespace-no-wrap text-gray-900">
            {location.latitude} | {location.longitude}
          </p>
        </td>
        <td className="border-b border-gray-200 bg-white px-5 py-5 text-sm">
          <p className="whitespace-no-wrap text-gray-900">
            <ClaimButton />
          </p>
        </td>
      </tr>
    </>
  );

  function ClaimButton() {
    if (pin.claimedAt) {
      return (
        <Button variant="secondary" className="" disabled>
          Claimed
        </Button>
      );
    } else if (location.assetId ?? location.pageAsset) {
      return (
        <Button
          variant="destructive"
          className="px-6 font-bold "
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
      return (
        <p className="me-2 rounded border border-pink-400 bg-pink-100 px-2.5 py-0.5 text-center text-xs font-medium text-pink-800 dark:bg-gray-700 dark:text-pink-400">
          Not claimable
        </p>
      );
    }
  }
}

function formatTitle(title: string) {
  return title.length > 20 ? title.slice(0, 20) + "..." : title;
}
