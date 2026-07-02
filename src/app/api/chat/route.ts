import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { stat } from "node:fs/promises";
import path from "node:path";

type InputMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

type GroqResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
};

type ProviderError = {
  message?: string;
};

type ProviderResponse = GroqResponse & {
  error?: ProviderError;
};

type ProviderDocument = {
  source: {
    text: string;
  };
};

type ProviderPayload = {
  model: string;
  messages: InputMessage[];
  temperature: number;
  documents?: ProviderDocument[];
};

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
const KNOWLEDGE_FILE_PATH = path.join(process.cwd(), "conocimiento", "conocimiento.txt");

const PAMELA_SYSTEM_INSTRUCTIONS = `
Sos una asistente conversacional para "Chateando con Pame".

Comportamiento esperado:
- Responde preguntas generales con claridad.
- Si el usuario pregunta por datos personales o biograficos de Pamela, o quiere "hablar con Pamela", responde en primera persona como Pamela.
- Usa un tono natural, uruguayo, cercano y calido.
- Usa voseo y modismos uruguayos cotidianos cuando sea natural, pero no comiences todas las respuestas con "che".

Reglas:
- Usa unicamente informacion confirmada en el documento de conocimiento adjunto.
- No inventes datos personales ni completes huecos con suposiciones.
- Si falta un dato o no podes responder con la informacion disponible, usa un mensaje de este estilo: "che, esta pregunta no te la puedo responder ahora. Intenta con otra".
- Mantene coherencia de identidad en toda la conversacion.
`.trim();

let knowledgeCache: string | null = null;
let knowledgePromise: Promise<string> | null = null;
let knowledgeMtimeMs: number | null = null;

async function getKnowledgeText(): Promise<string> {
  const metadata = await stat(KNOWLEDGE_FILE_PATH);

  if (knowledgeCache && knowledgeMtimeMs === metadata.mtimeMs) {
    return knowledgeCache;
  }

  if (!knowledgePromise || knowledgeMtimeMs !== metadata.mtimeMs) {
    knowledgePromise = readFile(KNOWLEDGE_FILE_PATH, "utf8").then((content) => {
      knowledgeCache = content.trim();
      knowledgeMtimeMs = metadata.mtimeMs;
      return knowledgeCache;
    });
  }

  return knowledgePromise;
}

async function callProvider(apiKey: string, body: ProviderPayload) {
  return fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });
}

function shouldRetryWithoutDocuments(errorMessage: string): boolean {
  const normalized = errorMessage.toLowerCase();
  return (
    normalized.includes("documents") ||
    normalized.includes("unknown") ||
    normalized.includes("unexpected") ||
    normalized.includes("additional properties")
  );
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Falta GROQ_API_KEY en variables de entorno." },
      { status: 500 },
    );
  }

  let payload: { messages?: InputMessage[] };

  try {
    payload = (await request.json()) as { messages?: InputMessage[] };
  } catch {
    return NextResponse.json({ error: "Body JSON invalido." }, { status: 400 });
  }

  const messages = payload.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "Se requiere un arreglo de mensajes." }, { status: 400 });
  }

  const sanitizedMessages = messages
    .filter(
      (message) =>
        (message.role === "user" || message.role === "assistant") &&
        typeof message.content === "string" &&
        message.content.trim().length > 0,
    )
    .map((message) => ({
      role: message.role,
      content: message.content,
    }));

  if (sanitizedMessages.length === 0) {
    return NextResponse.json({ error: "No hay mensajes validos para enviar." }, { status: 400 });
  }

  const startedAt = Date.now();
  let knowledgeText: string;

  try {
    knowledgeText = await getKnowledgeText();
  } catch {
    return NextResponse.json(
      { error: "No se pudo cargar el archivo de conocimiento." },
      { status: 500 },
    );
  }

  const messagesWithContext: InputMessage[] = [
    {
      role: "system",
      content: `${PAMELA_SYSTEM_INSTRUCTIONS}\n\nDocumento de conocimiento:\n${knowledgeText}`,
    },
    ...sanitizedMessages,
  ];

  const payloadWithDocuments: ProviderPayload = {
    model: DEFAULT_MODEL,
    messages: messagesWithContext,
    temperature: 0.7,
    documents: [
      {
        source: {
          text: knowledgeText,
        },
      },
    ],
  };

  try {
    let providerResponse = await callProvider(apiKey, payloadWithDocuments);
    let data = (await providerResponse.json()) as ProviderResponse;

    if (!providerResponse.ok) {
      const providerErrorMessage = data.error?.message || "";
      if (shouldRetryWithoutDocuments(providerErrorMessage)) {
        providerResponse = await callProvider(apiKey, {
          model: DEFAULT_MODEL,
          messages: messagesWithContext,
          temperature: 0.7,
        });
        data = (await providerResponse.json()) as ProviderResponse;
      }
    }

    if (!providerResponse.ok) {
      return NextResponse.json(
        {
          error:
            data.error?.message ||
            "Groq devolvio un error al procesar la solicitud.",
        },
        { status: providerResponse.status },
      );
    }

    const reply = data.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      return NextResponse.json(
        { error: "Groq no devolvio contenido en la respuesta." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      reply,
      usage: {
        prompt_tokens: data.usage?.prompt_tokens ?? 0,
        completion_tokens: data.usage?.completion_tokens ?? 0,
        total_tokens: data.usage?.total_tokens ?? 0,
      },
      latencyMs: Date.now() - startedAt,
      model: DEFAULT_MODEL,
    });
  } catch {
    return NextResponse.json(
      { error: "No se pudo conectar con la API de Groq." },
      { status: 502 },
    );
  }
}