"use client";

import { useEffect, useMemo, useState } from "react";
import { ChatHistorySidebar } from "@/components/chat/ChatHistorySidebar";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { MetricsPanel } from "@/components/chat/MetricsPanel";
import type { ChatMessage, MetricCard, Usage } from "@/components/chat/types";

type ChatApiResponse = {
  reply?: string;
  usage?: Usage;
  latencyMs?: number;
  model?: string;
  error?: string;
};

type PersistedSession = {
  messages: ChatMessage[];
  usage: Usage;
  latencyMs: number | null;
  model: string;
};

const STORAGE_KEY = "neon-nocturne-session-v1";
const DEFAULT_MODEL = "llama-3.1-8b-instant";

const ZERO_USAGE: Usage = {
  prompt_tokens: 0,
  completion_tokens: 0,
  total_tokens: 0,
};

function nowTime(): string {
  return new Date().toLocaleTimeString("en-GB", { hour12: false });
}

function bootMessage(): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role: "assistant",
    content: "Session booted. Lista para responder con Groq y modelo Llama 3.",
    time: nowTime(),
  };
}

function addUsage(current: Usage, incoming: Usage): Usage {
  return {
    prompt_tokens: current.prompt_tokens + incoming.prompt_tokens,
    completion_tokens: current.completion_tokens + incoming.completion_tokens,
    total_tokens: current.total_tokens + incoming.total_tokens,
  };
}

function padCount(value: number): string {
  return String(value).padStart(6, "0");
}

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([bootMessage()]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<Usage>(ZERO_USAGE);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [model, setModel] = useState(DEFAULT_MODEL);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as PersistedSession;
      const restoredMessages = Array.isArray(parsed.messages)
        ? parsed.messages.filter(
            (item) =>
              typeof item.id === "string" &&
              (item.role === "user" || item.role === "assistant") &&
              typeof item.content === "string" &&
              typeof item.time === "string",
          )
        : [];

      setMessages(restoredMessages.length > 0 ? restoredMessages : [bootMessage()]);
      setUsage({
        prompt_tokens: Number(parsed.usage?.prompt_tokens ?? 0),
        completion_tokens: Number(parsed.usage?.completion_tokens ?? 0),
        total_tokens: Number(parsed.usage?.total_tokens ?? 0),
      });
      setLatencyMs(typeof parsed.latencyMs === "number" ? parsed.latencyMs : null);
      setModel(typeof parsed.model === "string" ? parsed.model : DEFAULT_MODEL);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    const payload: PersistedSession = {
      messages,
      usage,
      latencyMs,
      model,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [latencyMs, messages, model, usage]);

  const metrics: MetricCard[] = useMemo(
    () => [
      { id: "prompt", label: "Prompt Tokens", value: padCount(usage.prompt_tokens), detail: "input" },
      {
        id: "completion",
        label: "Completion Tokens",
        value: padCount(usage.completion_tokens),
        detail: "output",
      },
      {
        id: "total",
        label: "Total Session Tokens",
        value: padCount(usage.total_tokens),
        detail: "session",
      },
      { id: "model", label: "Model Name", value: model, detail: "groq" },
      {
        id: "latency",
        label: "Response Time",
        value: latencyMs == null ? "-" : `${(latencyMs / 1000).toFixed(2)}s`,
        detail: "last request",
      },
    ],
    [latencyMs, model, usage.completion_tokens, usage.prompt_tokens, usage.total_tokens],
  );

  async function handleSendMessage(): Promise<void> {
    const trimmed = input.trim();
    if (!trimmed || isLoading) {
      return;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      time: nowTime(),
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setError(null);
    setIsLoading(true);

    const startedAt = Date.now();

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
        }),
      });

      const payload = (await response.json()) as ChatApiResponse;
      const assistantReply = payload.reply;

      if (!response.ok || typeof assistantReply !== "string" || assistantReply.trim().length === 0) {
        throw new Error(payload.error || "No se pudo obtener respuesta de Groq.");
      }

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: assistantReply,
          time: nowTime(),
        },
      ]);

      const usageFromPayload = payload.usage;
      if (usageFromPayload) {
        setUsage((prev) => addUsage(prev, usageFromPayload));
      }

      setLatencyMs(typeof payload.latencyMs === "number" ? payload.latencyMs : Date.now() - startedAt);
      if (typeof payload.model === "string" && payload.model.length > 0) {
        setModel(payload.model);
      }
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Error inesperado";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  function handleResetSession(): void {
    setMessages([bootMessage()]);
    setInput("");
    setError(null);
    setIsLoading(false);
    setUsage(ZERO_USAGE);
    setLatencyMs(null);
    setModel(DEFAULT_MODEL);
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(132,204,22,0.12),transparent_38%),radial-gradient(circle_at_80%_0%,rgba(163,230,53,0.08),transparent_34%)]" />

      <main className="relative mx-auto grid min-h-screen w-full max-w-[1600px] grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)_340px]">
        <ChatHistorySidebar />
        <ChatWindow
          messages={messages}
          input={input}
          isLoading={isLoading}
          error={error}
          onInputChange={setInput}
          onSend={handleSendMessage}
          onReset={handleResetSession}
        />
        <MetricsPanel metrics={metrics} />
      </main>
    </div>
  );
}
