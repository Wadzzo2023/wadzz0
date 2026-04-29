export interface ChatMessage {
    role: "user" | "assistant"
    content: string
    timestamp?: Date
}

export interface PinAnalysisRequest {
    message: string
    conversationHistory: ChatMessage[]
    pinIds?: string[]
}

export interface PinForChat {
    id: string
    title: string
    description: string
    consumerCount: number
}
