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
  sessions?: ChatSession[];
  activeSessionId?: string;

  // Legacy fields (single-session format)
  messages?: ChatMessage[];
  lastUsage?: Usage;
  cumulativeUsage?: Usage;
  usage?: Usage;
  latencyMs?: number | null;
  model?: string;
  language?: Language;
};

type Language = "es" | "en";

type ChatSession = {
  id: string;
  title: string;
  messages: ChatMessage[];
  lastUsage: Usage;
  cumulativeUsage: Usage;
  latencyMs: number | null;
  model: string;
  updatedAt: number;
};

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

function defaultSessionTitle(language: Language): string {
  return language === "es" ? "Nueva charla" : "New chat";
}

function buildSessionTitle(content: string, language: Language): string {
  const compact = content.replace(/\s+/g, " ").trim();
  if (compact.length === 0) {
    return defaultSessionTitle(language);
  }

  return compact.length > 36 ? `${compact.slice(0, 33)}...` : compact;
}

function normalizeUsage(value: Partial<Usage> | undefined): Usage {
  return {
    prompt_tokens: Number(value?.prompt_tokens ?? 0),
    completion_tokens: Number(value?.completion_tokens ?? 0),
    total_tokens: Number(value?.total_tokens ?? 0),
  };
}

function normalizeMessages(messages: unknown): ChatMessage[] {
  if (!Array.isArray(messages)) {
    return [];
  }

  return messages.filter(
    (item): item is ChatMessage =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as ChatMessage).id === "string" &&
      ((item as ChatMessage).role === "user" || (item as ChatMessage).role === "assistant") &&
      typeof (item as ChatMessage).content === "string" &&
      typeof (item as ChatMessage).time === "string",
  );
}

function createSession(language: Language): ChatSession {
  return {
    id: crypto.randomUUID(),
    title: defaultSessionTitle(language),
    messages: [bootMessage(language)],
    lastUsage: { ...ZERO_USAGE },
    cumulativeUsage: { ...ZERO_USAGE },
    latencyMs: null,
    model: DEFAULT_MODEL,
    updatedAt: Date.now(),
  };
}

function normalizeSession(raw: unknown, language: Language): ChatSession | null {
  if (typeof raw !== "object" || raw === null) {
    return null;
  }

  const source = raw as Partial<ChatSession>;
  const safeMessages = normalizeMessages(source.messages);
  const fallback = createSession(language);

  return {
    id: typeof source.id === "string" ? source.id : fallback.id,
    title:
      typeof source.title === "string" && source.title.trim().length > 0
        ? source.title
        : defaultSessionTitle(language),
    messages: safeMessages.length > 0 ? safeMessages : fallback.messages,
    lastUsage: normalizeUsage(source.lastUsage),
    cumulativeUsage: normalizeUsage(source.cumulativeUsage),
    latencyMs: typeof source.latencyMs === "number" ? source.latencyMs : null,
    model: typeof source.model === "string" && source.model.length > 0 ? source.model : DEFAULT_MODEL,
    updatedAt: typeof source.updatedAt === "number" ? source.updatedAt : Date.now(),
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
  const [sessions, setSessions] = useState<ChatSession[]>([createSession("es")]);
  const [activeSessionId, setActiveSessionId] = useState<string>(sessions[0].id);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as PersistedSession;
      const restoredLanguage = parsed.language === "en" ? "en" : "es";

      let restoredSessions: ChatSession[] = [];
      if (Array.isArray(parsed.sessions)) {
        restoredSessions = parsed.sessions
          .map((session) => normalizeSession(session, restoredLanguage))
          .filter((session): session is ChatSession => session !== null);
      }

      if (restoredSessions.length === 0) {
        const migratedMessages = normalizeMessages(parsed.messages);
        const migratedSession: ChatSession = {
          id: crypto.randomUUID(),
          title: defaultSessionTitle(restoredLanguage),
          messages: migratedMessages.length > 0 ? migratedMessages : [bootMessage(restoredLanguage)],
          lastUsage: normalizeUsage(parsed.lastUsage),
          cumulativeUsage: normalizeUsage(parsed.cumulativeUsage ?? parsed.lastUsage ?? parsed.usage),
          latencyMs: typeof parsed.latencyMs === "number" ? parsed.latencyMs : null,
          model: typeof parsed.model === "string" && parsed.model.length > 0 ? parsed.model : DEFAULT_MODEL,
          updatedAt: Date.now(),
        };
        restoredSessions = [migratedSession];
      }

      const restoredActiveSessionId =
        typeof parsed.activeSessionId === "string" &&
        restoredSessions.some((session) => session.id === parsed.activeSessionId)
          ? parsed.activeSessionId
          : restoredSessions[0].id;

      const frame = requestAnimationFrame(() => {
        setLanguage(restoredLanguage);
        setSessions(restoredSessions);
        setActiveSessionId(restoredActiveSessionId);
      });

      return () => cancelAnimationFrame(frame);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    const payload = {
      sessions,
      activeSessionId,
      language,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [activeSessionId, language, sessions]);

  const copy = COPY[language];
  const activeSession = sessions.find((session) => session.id === activeSessionId) ?? sessions[0];
  const messages = activeSession?.messages ?? [];
  const lastUsage = activeSession?.lastUsage ?? ZERO_USAGE;
  const cumulativeUsage = activeSession?.cumulativeUsage ?? ZERO_USAGE;
  const latencyMs = activeSession?.latencyMs ?? null;
  const model = activeSession?.model ?? DEFAULT_MODEL;

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
    if (!trimmed || isLoading || !activeSession) {
      return;
    }

    const targetSessionId = activeSession.id;
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      time: nowTime(),
    };

    const nextMessages = [...activeSession.messages, userMessage];
    const hasUserMessages = activeSession.messages.some((message) => message.role === "user");
    const nextTitle = hasUserMessages ? activeSession.title : buildSessionTitle(trimmed, language);

    setSessions((prev) =>
      prev.map((session) =>
        session.id === targetSessionId
          ? {
              ...session,
              title: nextTitle,
              messages: nextMessages,
              updatedAt: Date.now(),
            }
          : session,
      ),
    );
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

      setSessions((prev) =>
        prev.map((session) => {
          if (session.id !== targetSessionId) {
            return session;
          }

          const nextSession: ChatSession = {
            ...session,
            messages: [
              ...session.messages,
              {
                id: crypto.randomUUID(),
                role: "assistant",
                content: assistantReply,
                time: nowTime(),
              },
            ],
            latencyMs:
              typeof payload.latencyMs === "number" ? payload.latencyMs : Date.now() - startedAt,
            model:
              typeof payload.model === "string" && payload.model.length > 0
                ? payload.model
                : session.model,
            updatedAt: Date.now(),
          };

          if (payload.usage) {
            nextSession.lastUsage = payload.usage;
            nextSession.cumulativeUsage = addUsage(nextSession.cumulativeUsage, payload.usage);
          }

          return nextSession;
        }),
      );
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

  function handleSelectSession(sessionId: string): void {
    setActiveSessionId(sessionId);
    setInput("");
    setError(null);
    setIsLoading(false);
  }

  function handleCreateSession(): void {
    const nextSession = createSession(language);
    setSessions((prev) => [nextSession, ...prev]);
    setActiveSessionId(nextSession.id);
    setInput("");
    setError(null);
    setIsLoading(false);
  }

  function handleResetSession(): void {
    if (sessions.length <= 1) {
      const replacement = createSession(language);
      setSessions([replacement]);
      setActiveSessionId(replacement.id);
    } else {
      const remaining = sessions.filter((session) => session.id !== activeSessionId);
      setSessions(remaining);
      setActiveSessionId(remaining[0].id);
    }

    setInput("");
    setError(null);
    setIsLoading(false);
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
          }}
          sessions={sessions.map((session) => ({ id: session.id, title: session.title }))}
          activeSessionId={activeSessionId}
          onSelectSession={handleSelectSession}
          onCreateSession={handleCreateSession}
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
