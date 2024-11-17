import { create } from "zustand";
import { ConsumedLocation } from "@app/types/CollectionTypes";

export interface PinData {
  nearbyPins?: ConsumedLocation[];
  singleAR?: boolean;
}

interface PinStore {
  data: PinData;
  setData: (data: PinData) => void;
}

const currentLocation = { lat: 23.8028012, lan: 90.3643056 };
// Generate random latitude and longitude within 100 meters
const randomOffset = () => (Math.random() - 0.5) * 0.0009; // ~100 meters
const generateRandomBoxPositions = (lat: number, lon: number) => [
  {
    lat: lat + randomOffset(),
    lon: lon + randomOffset(),
    color: 0xff0000,
    name: "item 1",
  },
  {
    lat: lat + randomOffset(),
    lon: lon + randomOffset(),
    color: 0xffff00,
    name: "item 2",
  },
  {
    lat: lat + randomOffset(),
    lon: lon + randomOffset(),
    color: 0x00ff00,
    name: "item 3",
  },
  {
    lat: lat + randomOffset(),
    lon: lon + randomOffset(),
    color: 0x0000ff,
    name: "item 4",
  },
];

const pins: ConsumedLocation[] = generateRandomBoxPositions(
  currentLocation.lat,
  currentLocation.lan
).map((pin, i) => {
  return {
    id: Math.random().toString(),
    lat: pin.lat,
    lng: pin.lon,
    title: `Item ${i}`,
    description: "Description",
    brand_name: "Brand Name " + i,
    url: "https://example.com",
    image_url: "https://picsum.photos/300/300",
    collected: false,
    collection_limit_remaining: 1,
    auto_collect: false,
    brand_image_url: "https://picsum.photos/300/300",
    brand_id: "brand_id",
    modal_url: "https://example.com/modal",
    viewed: false,
  };
});

export const useNearByPin = create<PinStore>((set) => ({
  data: {
    nearbyPins: pins,
    singleAR: false,
  },
  setData: (data: PinData) => set({ data }),
}));
