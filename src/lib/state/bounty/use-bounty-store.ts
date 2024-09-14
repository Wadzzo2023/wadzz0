import { BountyStatus } from "@prisma/client";
import { create } from "zustand";
export interface BountyProps {
    id: number;
    title: string;
    description: string;
    priceInUSD: number;
    priceInBand: number;
    creator: {
        name: string;
    };
    imageUrls: string[];
    createdAt: Date; // Changed from string to Date
    _count: {
        participants: number;
    };
    requiredBalance: number; // Changed from requiredBalance to requredBalance
    status: BountyStatus;
    winner?: {
        name: string | null;
    };
}

interface BountyRightState {
    open: boolean;
    currentData?: BountyProps;
    setOpen: (value: boolean) => void;
    setData: (value?: BountyProps) => void;
}

export const useBountyRightStore = create<BountyRightState>((set) => ({
    open: false,
    setOpen: (open) => set({ open }),
    setData: (currentData) => set({ currentData }),
}));
