/**
 * Types for Pin Creation Agent
 */

export interface EventData {
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  startDate: string; // ISO string
  endDate: string; // ISO string
  url?: string;
  image?: string;
  venue?: string;
  address?: string;
}

export interface AgentResponse {
  message: string;
  events?: EventData[];
  type: "text" | "events";
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}
