import { NextRequest, NextResponse } from "next/server";

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

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

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
        (message.role === "user" || message.role === "assistant" || message.role === "system") &&
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

  try {
    const groqResponse = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: sanitizedMessages,
        temperature: 0.7,
      }),
    });

    const data = (await groqResponse.json()) as GroqResponse & { error?: { message?: string } };

    if (!groqResponse.ok) {
      return NextResponse.json(
        {
          error:
            data.error?.message ||
            "Groq devolvio un error al procesar la solicitud.",
        },
        { status: groqResponse.status },
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