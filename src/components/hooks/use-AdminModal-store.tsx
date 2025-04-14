import { create } from "zustand";

export type IPin = {
    title?: string;
    lat: number;
    lng: number;
    description?: string;
    startDate?: Date;
    endDate?: Date;
    autoCollect: boolean;
    pinNumber?: number;
    pinCollectionLimit?: number;
    tier?: string;
    url?: string;
    image?: string;
    token?: number;
};

interface IMapPinModal {
    isOpen: boolean;
    setIsOpen: (value: boolean) => void;
    prevData?: IPin;
    setPrevData: (value?: IPin) => void;
    manual: boolean;
    duplicate: boolean;
    setDuplicate: (value: boolean) => void;
    position: google.maps.LatLngLiteral | undefined;
    setManual: (value: boolean) => void;
    setPosition: (pos: google.maps.LatLngLiteral | undefined) => void;
}

export const useAdminMapModalStore = create<IMapPinModal>((set) => ({
    isOpen: false,
    setPrevData: (value) => set({ prevData: value }),

    setIsOpen: (value) => set({ isOpen: value }),
    manual: false,
    duplicate: false,
    setDuplicate: (value) => set({ duplicate: value }),
    position: undefined,
    setManual: (value) => set({ manual: value }),
    setPosition: (pos) => set({ position: pos }),
}));
