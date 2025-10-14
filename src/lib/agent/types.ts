/**
 * Types for Pin Creation Agent
 */

export interface EventData {
  title: string
  description: string
  latitude: number
  longitude: number
  startDate: string // ISO string
  endDate: string // ISO string
  url?: string
  image?: string
  venue?: string
  address?: string
  // Pin configuration parameters
  pinCollectionLimit?: number
  pinNumber?: number
  autoCollect?: boolean
  multiPin?: boolean
  radius?: number
}

export interface AgentResponse {
  message: string
  events?: EventData[]
  type: "text" | "events" | "update"
}

export interface ChatMessage {
  role: "user" | "assistant" | "system"
  content: string
}

export interface PinConfiguration {
  pinCollectionLimit: number
  pinNumber: number
  autoCollect: boolean
  multiPin: boolean
  radius: number
}
