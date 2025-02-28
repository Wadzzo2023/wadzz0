import { Creator } from "@prisma/client";
import { create } from "zustand";
type UserLocationType = {
    latitude: number;
    longitude: number;
};

interface selectDestinationProps {
    data?: UserLocationType;
    setData: (data: UserLocationType) => void;
}

export const useDestinationStore = create<selectDestinationProps>((set) => ({
    data: undefined,
    setData: (data) => set({ data }),
}));
