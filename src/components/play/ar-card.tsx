import { ConsumedLocation } from "~/types/game/location";

interface InfoBoxProps {
  pin: ConsumedLocation;
  tandName?: string;
  position?: { left: number; top: number };
}

export default function ArCard({
  pin,
  position = { left: 0, top: 0 },
}: InfoBoxProps) {
  return (
    <>
      <div
        className="w-52 overflow-hidden rounded-lg bg-white shadow-lg dark:bg-gray-800"
        style={{
          position: "absolute",
          left: `${position.left}px`,
          top: `${position.top}px`,
          backgroundImage: `url(${pin.image_url})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="bg-white bg-opacity-75 p-4 dark:bg-gray-800 dark:bg-opacity-75">
          <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white">
            {pin.title}
          </h3>
          <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">
            {pin.description}
          </p>
          <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">
            URL:{" "}
            <a href={pin.url} className="text-blue-500">
              {pin.url}
            </a>
          </p>
          <span className="inline-block rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-900 dark:text-blue-300">
            {pin.brand_name}
          </span>
          <div className="mt-2">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Collection Limit: {pin.collection_limit_remaining}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {pin.collected ? "Collected" : "Not Collected"}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
