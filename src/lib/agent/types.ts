// ============================================================
// AGENT TYPES
// ============================================================

export type AgentTask = "event" | "landmark" | null;
export type AgentStep =
  | "idle"
  | "clarify_task"
  | "event_search"
  | "event_confirm_list"
  | "event_pin_dates"
  | "event_pin_config"
  | "event_final_confirm"
  | "landmark_search"
  | "landmark_confirm_list"
  | "landmark_redeem_mode"
  | "landmark_pin_dates"
  | "landmark_pin_config"
  | "landmark_final_confirm"
  | "pin_generation"
  | "done";

export interface EventData {
  id: string;
  title: string;
  description: string;
  startDate: string; // ISO
  endDate: string; // ISO
  latitude: number;
  longitude: number;
  venue?: string;
  address?: string;
  url?: string;
  image?: string;
}

export interface LandmarkData {
  id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  venue?: string;
  address?: string;
  url?: string;
  image?: string;
  category?: string;
}

export interface PinConfig {
  startDate: string;
  endDate: string;
  pinCollectionLimit?: number;
  pinNumber?: number;
  autoCollect?: boolean;
  radius?: number;
}

export interface PinItem {
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  url?: string;
  image?: string;
  venue?: string;
  address?: string;
  startDate: string;
  endDate: string;
  pinCollectionLimit?: number;
  pinNumber?: number;
  autoCollect?: boolean;
  multiPin?: boolean;
  radius?: number;
  type?: "EVENT" | "LANDMARK";
}

export interface AgentState {
  step: AgentStep;
  task: AgentTask;
  searchQuery?: string;
  searchArea?: string;
  events?: EventData[];
  selectedEvents?: EventData[];
  landmarks?: LandmarkData[];
  selectedLandmarks?: LandmarkData[];
  pinConfig?: Partial<PinConfig>;
  pins?: PinItem[];
  redeemMode?: "separate" | "single";
  pendingModification?: {
    indices?: number[];
    names?: string[];
  };
}

export interface Message {
  role: "user" | "assistant";
  content: string;
  // Optional structured data for rich UI rendering
  uiData?: {
    type:
    | "event_list"
    | "landmark_list"
    | "pin_config_form"
    | "date_picker"
    | "confirm"
    | "task_select"
    | "pin_result"
    | "next_action"
    | "redeem_mode_select";
    data: unknown;
  };
}

export interface ChatRequest {
  messages: { role: "user" | "assistant"; content: string }[];
  state: AgentState;
}

export interface ChatResponse {
  message: string;
  state: AgentState;
  uiData?: Message["uiData"];
}