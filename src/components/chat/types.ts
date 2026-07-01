export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  time: string;
};

export type MetricCard = {
  id: string;
  label: string;
  value: string;
  detail: string;
};

export type Usage = {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
};
