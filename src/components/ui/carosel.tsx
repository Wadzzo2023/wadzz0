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
          className="bg-base-100"
          key={index}
          src={image}
          alt="City"
        />
      ))}
    </Carousel>
  );
}
