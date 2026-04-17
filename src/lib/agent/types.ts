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
  // Pin configuration parameters
  pinCollectionLimit?: number;
  pinNumber?: number;
  autoCollect?: boolean;
  multiPin?: boolean;
  radius?: number;
  id?: string;
}

export interface LandmarkData {
  id: string;
  title: string;
  category: string;
  address?: string;
  description?: string;
  latitude: number;
  longitude: number;
  startDate?: string;
  endDate?: string;
  // Pin configuration parameters
  pinCollectionLimit?: number;
  pinNumber?: number;
  autoCollect?: boolean;
  radius?: number;
}

export interface AgentResponse {
  message: string;
  events?: EventData[];
  type: "text" | "events" | "update";
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface PinConfiguration {
  pinCollectionLimit: number;
  pinNumber: number;
  autoCollect: boolean;
  multiPin: boolean;
  radius: number;
}

export type AgentTask = "event" | "landmark";

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  uiData?: {
    type:
      | "task_select"
      | "event_list"
      | "landmark_list"
      | "location_list"
      | "config_step"
      | "complete"
      | "error"
      | "idle";
    data?: Record<string, unknown>;
  };
}

export interface PinItem {
  id?: string;
  title: string;
  category?: string;
  address?: string;
  description?: string;
  latitude: number;
  longitude: number;
  startDate?: string;
  endDate?: string;
  pinCollectionLimit?: number;
  pinNumber?: number;
  autoCollect?: boolean;
  multiPin?: boolean;
  radius?: number;
}

export interface AgentState {
  step:
    | "idle"
    | "task_select"
    | "event_list"
    | "landmark_list"
    | "location_list"
    | "config_step"
    | "complete"
    | "error";
  task: AgentTask | null;
}
