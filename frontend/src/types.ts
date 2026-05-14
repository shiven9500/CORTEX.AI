export type Sender = "user" | "ai";
export interface Message {
  id: string;
  sender: Sender;
  text: string;
  timestamp: number;
  state?: string;
  action?: string;
  analysis?: {
    detected_emotion: string;
    user_intent: string;
    cluster_group: number;
    strategy: string;
    engine?: string;
    quota_hit?: boolean;
  };

  isStreaming?: boolean;
}

export interface ChatResponse {
  response: string;
  emotion: string;
  action: string;
  state: string;
  analysis: {
    detected_emotion: string;
    user_intent: string;
    cluster_group: number;
    strategy: string;
    engine?: string;
    quota_hit?: boolean;
  };
  remaining?: number;
}

export interface FeedbackRequest {
  state: string;
  action: string;
  reward: number;
}