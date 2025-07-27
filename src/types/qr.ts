export interface QRDescription {
    id: string
    title: string
    content: string
    order: number
    qrItemId: string
}

export interface QRItem {
    id: string
    title: string
    modelUrl: string
    externalLink: string | null
    startDate: Date
    endDate: Date
    qrCode: string
    isActive: boolean
    creatorId: string
    createdAt: Date
    updatedAt: Date
    // Relations
    descriptions: QRDescription[]
}


export interface QRItemWithCreator extends QRItem {
    creator: {
        id: string
        name: string | null
        image: string | null
    }
}

