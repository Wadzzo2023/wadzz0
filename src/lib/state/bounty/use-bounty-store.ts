import { BountyStatus } from "@prisma/client";
import { create } from "zustand";
export interface BountyProps {
    id: number;
    title: string;
    description: string;
    priceInUSD: number;
    priceInBand: number;
    requiredBalance: number;
    currentWinnerCount: number;
    imageUrls: string[];
    totalWinner: number;
    status: "PENDING" | "APPROVED" | "REJECTED";
    creatorId: string;
    _count: {
        participants: number;
        BountyWinner: number;
    }
    creator: {
        name: string;
        profileUrl: string | null;
    },
    BountyWinner: {
        user: {
            id: string;
        }
    }[],
    isJoined: boolean;
    isOwner: boolean;

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
