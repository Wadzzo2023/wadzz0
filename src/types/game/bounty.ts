export type Bounty = {
    id: string;
    title: string;
    description: string;
    priceInUSD: number;
    priceInBand: number;
    requiredBalance: number;
    imageUrls: string[];
    status: "PENDING" | "APPROVED" | "REJECTED";
    creatorId: string;
    _count: {
        participants: number;
    }
    creator: {
        name: string;
        profileUrl: string;
    },
    winnerId: string;
    isJoined: boolean;
}