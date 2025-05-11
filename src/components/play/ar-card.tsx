interface InfoBoxProps {
  title?: string;
  description?: string;
  brandName?: string;
  position?: { left: number; top: number };
}

export default function ArCard({
  title = "Item",
  description = "No description available",
  brandName = "Unknown Brand",
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
        }}
      >
        <div className="p-4">
          <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white">
            {title}
          </h3>
          <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">
            {description}
          </p>
          <span className="inline-block rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-900 dark:text-blue-300">
            {brandName}
          </span>
        </div>
      </div>
    </>
  );
}
