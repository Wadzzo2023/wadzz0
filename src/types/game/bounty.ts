export type Bounty = {
    id: string;
    title: string;
    description: string;
    priceInUSD: number;
    priceInBand: number;
    requiredBalance: number;
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
        profileUrl: string;
    },
    BountyWinner: {
        userId: string;
    }[],
    isJoined: boolean;
    isOwner: boolean;
}