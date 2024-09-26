import clsx from "clsx";
import { Carousel } from "react-daisyui";

export default function Slider({
  className,
  images,
}: {
  images: string[];
  className?: string;
}) {
  return (
    <Carousel display="sequential" className="rounded-box">
      {images.map((image, index) => (
        <Carousel.Item
          className={clsx("bg-base-100 ", className)}
          buttonStyle={(value) => {
            return (
              <button className="mb-2 me-2 rounded-lg border border-blue-700 px-2 py-2 text-center text-sm font-medium text-blue-700 hover:bg-blue-800 hover:text-white focus:outline-none focus:ring-4 focus:ring-blue-300 dark:border-blue-500 dark:text-blue-500 dark:hover:bg-blue-500 dark:hover:text-white dark:focus:ring-blue-800 ">
                {value}
              </button>
            );
          }}
          key={index}
          src={image}
          alt="City"
        />
      ))}
    </Carousel>
  );
}
