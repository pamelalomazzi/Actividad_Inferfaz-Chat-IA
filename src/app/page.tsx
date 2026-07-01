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
  lastUsage: Usage;
  cumulativeUsage: Usage;
  usage?: Usage;
  latencyMs: number | null;
  model: string;
  language?: Language;
};

type Language = "es" | "en";

const COPY: Record<
  Language,
  {
    bootMessage: string;
    metricsTitle: string;
    metricPromptLast: string;
    metricCompletionLast: string;
    metricTotalLast: string;
    metricPromptAcc: string;
    metricCompletionAcc: string;
    metricTotalAcc: string;
    metricModel: string;
    metricLatency: string;
    metricTps: string;
    subtitle: string;
    clearConversation: string;
    roleUser: string;
    roleAssistant: string;
    messageInput: string;
    placeholder: string;
    sending: string;
    send: string;
    languageLabel: string;
    historyTitle: string;
    newButton: string;
    consoleName: string;
    settingsTitle: string;
    themeLabel: string;
    providerLabel: string;
    sessions: string[];
  }
> = {
  es: {
    bootMessage: "Sesion iniciada. Lista para responder con Groq y modelo Llama 3.",
    metricsTitle: "Metricas de la sesion",
    metricPromptLast: "Tokens prompt (ultima)",
    metricCompletionLast: "Tokens completion (ultima)",
    metricTotalLast: "Tokens totales (ultima)",
    metricPromptAcc: "Acumulado prompt",
    metricCompletionAcc: "Acumulado completion",
    metricTotalAcc: "Acumulado total",
    metricModel: "Modelo usado",
    metricLatency: "Tiempo respuesta",
    metricTps: "Tokens por segundo",
    subtitle: "Espacio Groq para conversaciones con Llama 3",
    clearConversation: "Borrar conversacion",
    roleUser: "Usuario",
    roleAssistant: "Asistente",
    messageInput: "Entrada de mensaje",
    placeholder: "Escribe tu prompt para Llama 3...",
    sending: "Enviando...",
    send: "Enviar",
    languageLabel: "Idioma",
    historyTitle: "Historial",
    newButton: "Nuevo",
    consoleName: "Chateando con Pame",
    settingsTitle: "Ajustes",
    themeLabel: "tema",
    providerLabel: "proveedor",
    sessions: ["Planificacion sprint", "Depuracion API", "Ajuste de prompts", "Build nocturno"],
  },
  en: {
    bootMessage: "Session started. Ready to respond using Groq and Llama 3.",
    metricsTitle: "Session metrics",
    metricPromptLast: "Prompt tokens (last)",
    metricCompletionLast: "Completion tokens (last)",
    metricTotalLast: "Total tokens (last)",
    metricPromptAcc: "Prompt accumulated",
    metricCompletionAcc: "Completion accumulated",
    metricTotalAcc: "Total accumulated",
    metricModel: "Model used",
    metricLatency: "Response time",
    metricTps: "Tokens per second",
    subtitle: "Groq workspace for Llama 3 conversations",
    clearConversation: "Clear conversation",
    roleUser: "User",
    roleAssistant: "Assistant",
    messageInput: "Message input",
    placeholder: "Type your prompt for Llama 3...",
    sending: "Sending...",
    send: "Send",
    languageLabel: "Language",
    historyTitle: "History",
    newButton: "New",
    consoleName: "Chatting with Pame",
    settingsTitle: "Settings",
    themeLabel: "theme",
    providerLabel: "provider",
    sessions: ["Sprint planning", "API debug", "Prompt tuning", "Night build"],
  },
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

function bootMessage(language: Language): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role: "assistant",
    content: COPY[language].bootMessage,
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

export default function Home() {
  const [language, setLanguage] = useState<Language>("es");
  const [messages, setMessages] = useState<ChatMessage[]>([bootMessage("es")]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUsage, setLastUsage] = useState<Usage>(ZERO_USAGE);
  const [cumulativeUsage, setCumulativeUsage] = useState<Usage>(ZERO_USAGE);
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

      const restoredLastUsage = parsed.lastUsage ?? ZERO_USAGE;
      const restoredCumulativeUsage = parsed.cumulativeUsage ?? parsed.lastUsage ?? parsed.usage ?? ZERO_USAGE;
      const restoredLanguage = parsed.language === "en" ? "en" : "es";

      const frame = requestAnimationFrame(() => {
        setLanguage(restoredLanguage);
        setMessages(restoredMessages.length > 0 ? restoredMessages : [bootMessage(restoredLanguage)]);

        setLastUsage({
          prompt_tokens: Number(restoredLastUsage.prompt_tokens ?? 0),
          completion_tokens: Number(restoredLastUsage.completion_tokens ?? 0),
          total_tokens: Number(restoredLastUsage.total_tokens ?? 0),
        });

        setCumulativeUsage({
          prompt_tokens: Number(restoredCumulativeUsage.prompt_tokens ?? 0),
          completion_tokens: Number(restoredCumulativeUsage.completion_tokens ?? 0),
          total_tokens: Number(restoredCumulativeUsage.total_tokens ?? 0),
        });
        setLatencyMs(typeof parsed.latencyMs === "number" ? parsed.latencyMs : null);
        setModel(typeof parsed.model === "string" ? parsed.model : DEFAULT_MODEL);
      });

      return () => cancelAnimationFrame(frame);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    const payload: PersistedSession = {
      messages,
      lastUsage,
      cumulativeUsage,
      latencyMs,
      model,
      language,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [cumulativeUsage, language, lastUsage, latencyMs, messages, model]);

  const copy = COPY[language];

  const metrics: MetricCard[] = useMemo(
    () => [
      {
        id: "prompt-last",
        label: copy.metricPromptLast,
        value: String(lastUsage.prompt_tokens),
      },
      {
        id: "completion-last",
        label: copy.metricCompletionLast,
        value: String(lastUsage.completion_tokens),
      },
      {
        id: "total-last",
        label: copy.metricTotalLast,
        value: String(lastUsage.total_tokens),
      },
      {
        id: "prompt-acc",
        label: copy.metricPromptAcc,
        value: String(cumulativeUsage.prompt_tokens),
      },
      {
        id: "completion-acc",
        label: copy.metricCompletionAcc,
        value: String(cumulativeUsage.completion_tokens),
      },
      {
        id: "total-acc",
        label: copy.metricTotalAcc,
        value: String(cumulativeUsage.total_tokens),
      },
      { id: "model", label: copy.metricModel, value: model },
      {
        id: "latency",
        label: copy.metricLatency,
        value: latencyMs == null ? "-" : `${latencyMs} ms`,
      },
      {
        id: "tps",
        label: copy.metricTps,
        value:
          latencyMs == null || latencyMs <= 0
            ? "-"
            : (lastUsage.total_tokens / (latencyMs / 1000)).toFixed(2),
      },
    ],
    [
      cumulativeUsage.completion_tokens,
      cumulativeUsage.prompt_tokens,
      cumulativeUsage.total_tokens,
      copy.metricCompletionAcc,
      copy.metricCompletionLast,
      copy.metricLatency,
      copy.metricModel,
      copy.metricPromptAcc,
      copy.metricPromptLast,
      copy.metricTotalAcc,
      copy.metricTotalLast,
      copy.metricTps,
      lastUsage.completion_tokens,
      lastUsage.prompt_tokens,
      lastUsage.total_tokens,
      latencyMs,
      model,
    ],
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
        setLastUsage(usageFromPayload);
        setCumulativeUsage((prev) => addUsage(prev, usageFromPayload));
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

  function handleLanguageChange(nextLanguage: Language): void {
    setLanguage(nextLanguage);
  }

  function handleResetSession(): void {
    setMessages([]);
    setInput("");
    setError(null);
    setIsLoading(false);
    setLastUsage(ZERO_USAGE);
    setCumulativeUsage(ZERO_USAGE);
    setLatencyMs(null);
    setModel(DEFAULT_MODEL);
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(132,204,22,0.12),transparent_38%),radial-gradient(circle_at_80%_0%,rgba(163,230,53,0.08),transparent_34%)]" />

      <main className="relative mx-auto grid min-h-screen w-full max-w-[1600px] grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)_340px]">
        <ChatHistorySidebar
          copy={{
            historyTitle: copy.historyTitle,
            newButton: copy.newButton,
            consoleName: copy.consoleName,
            settingsTitle: copy.settingsTitle,
            themeLabel: copy.themeLabel,
            providerLabel: copy.providerLabel,
            sessions: copy.sessions,
          }}
        />
        <ChatWindow
          messages={messages}
          input={input}
          isLoading={isLoading}
          error={error}
          language={language}
          copy={{
            subtitle: copy.subtitle,
            clearConversation: copy.clearConversation,
            roleUser: copy.roleUser,
            roleAssistant: copy.roleAssistant,
            messageInput: copy.messageInput,
            placeholder: copy.placeholder,
            sending: copy.sending,
            send: copy.send,
            languageLabel: copy.languageLabel,
          }}
          onInputChange={setInput}
          onLanguageChange={handleLanguageChange}
          onSend={handleSendMessage}
          onReset={handleResetSession}
        />
        <MetricsPanel metrics={metrics} title={copy.metricsTitle} />
      </main>
    </div>
  );
}
