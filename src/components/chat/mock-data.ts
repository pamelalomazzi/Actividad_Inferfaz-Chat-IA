import type { ChatMessage, MetricCard } from "@/components/chat/types";

export const mockMessages: ChatMessage[] = [
  {
    id: "a-1",
    role: "assistant",
    content:
      "Session initialized. Lista para mostrar prototipo responsive del layout Neon Nocturne.",
    time: "21:17:03",
  },
  {
    id: "u-1",
    role: "user",
    content: "Necesito validar visualmente el panel de metricas y el chat en tres columnas.",
    time: "21:17:21",
  },
  {
    id: "a-2",
    role: "assistant",
    content:
      "Perfecto. Este mock data te permite evaluar jerarquia visual, contraste y espaciado antes de integrar datos reales.",
    time: "21:17:33",
  },
];

export const mockMetrics: MetricCard[] = [
  { id: "prompt", label: "Prompt Tokens", value: "001284", detail: "input" },
  { id: "completion", label: "Completion Tokens", value: "000936", detail: "output" },
  { id: "total", label: "Total Session Tokens", value: "002220", detail: "session" },
  { id: "model", label: "Model Name", value: "llama-3.1-8b-instant", detail: "groq" },
  { id: "latency", label: "Response Time", value: "0.82s", detail: "avg" },
];
