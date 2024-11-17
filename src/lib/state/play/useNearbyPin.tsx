import { create } from "zustand";
import { ConsumedLocation } from "~/types/game/location";

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
const generateMultipleRandomBoxPositions = (
  lat: number,
  lon: number,
  count: number,
) => {
  const positions = [];
  for (let i = 0; i < count; i++) {
    positions.push({
      lat: lat + randomOffset(),
      lon: lon + randomOffset(),
      color: Math.floor(Math.random() * 16777215), // Random color
      name: `item ${i + 1}`,
    });
  }
  return positions;
};

const pins: ConsumedLocation[] = generateMultipleRandomBoxPositions(
  currentLocation.lat,
  currentLocation.lan,
  20,
).map((pin, i) => {
  return {
    id: Math.random(),
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
