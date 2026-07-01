# Nocturne AI

Interfaz de chat construida con Next.js, React y Tailwind CSS para integrarse con la API de Groq usando modelos Llama 3. La aplicación mantiene una estética oscura con acentos verde neón y conserva la sesión del chat en el navegador.

## Stack

- Next.js 16
- React 19
- Tailwind CSS 4
- API Route server-side para Groq
- Persistencia local con `localStorage`

## Configuración local

1. Instala dependencias:

```bash
npm install
```

2. Crea o completa el archivo `.env.local` en la raíz del proyecto:

```bash
GROQ_API_KEY=tu_api_key
GROQ_MODEL=llama-3.1-8b-instant
```

3. Inicia el entorno de desarrollo:

```bash
npm run dev
```

4. Abre la aplicación en `http://localhost:3000`.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Comportamiento implementado

- Envía el historial completo del chat al endpoint interno `/api/chat`
- El endpoint llama a Groq con `Authorization: Bearer` y `Content-Type: application/json`
- Renderiza la respuesta del asistente
- Lee y acumula `prompt_tokens`, `completion_tokens` y `total_tokens`
- Muestra también el modelo usado y el tiempo de respuesta
- Guarda mensajes y métricas en `localStorage`
- Recupera la sesión al recargar la pestaña
- Permite limpiar la sesión manualmente con `New Session`

## Validación manual

Usa esta checklist para corroborar los criterios de evaluación del proyecto.

### 1. La API de Groq se llama correctamente

Acción:

- Abre DevTools del navegador en la pestaña Network.
- Envía un mensaje desde la interfaz.
- Verifica la llamada a `/api/chat`.

Resultado esperado:

- La UI responde sin errores silenciosos.
- El endpoint server-side procesa la llamada.
- En el servidor se usa `Authorization: Bearer ${GROQ_API_KEY}` hacia Groq.

Referencia:

- [src/app/api/chat/route.ts](src/app/api/chat/route.ts)

### 2. El historial completo se envía en cada llamada

Acción:

- Envía dos o más mensajes consecutivos.
- Inspecciona el body enviado a `/api/chat`.

Resultado esperado:

- La propiedad `messages` incluye todos los mensajes previos de la sesión, no solo el último.

Referencia:

- [src/app/page.tsx](src/app/page.tsx)

### 3. La promesa usa async/await y muestra loading

Acción:

- Envía un mensaje.

Resultado esperado:

- El botón cambia a `Sending...`.
- El textarea y el botón quedan bloqueados mientras llega la respuesta.

Referencias:

- [src/app/page.tsx](src/app/page.tsx)
- [src/components/chat/ChatWindow.tsx](src/components/chat/ChatWindow.tsx)

### 4. Los errores se capturan y se muestran al usuario

Acción:

- Quita temporalmente `GROQ_API_KEY` de `.env.local` y reinicia el servidor.
- Envía un mensaje.

Resultado esperado:

- Se muestra un mensaje entendible, por ejemplo que falta la clave o que no se pudo obtener respuesta.
- No aparece un stack trace técnico en pantalla.

Referencias:

- [src/app/api/chat/route.ts](src/app/api/chat/route.ts)
- [src/components/chat/ChatWindow.tsx](src/components/chat/ChatWindow.tsx)

### 5. useState gestiona mensajes, loading y métricas

Acción:

- Revisa la interacción completa del chat.

Resultado esperado:

- Los mensajes aparecen en pantalla.
- El estado de carga cambia durante la petición.
- Las métricas se actualizan después de cada respuesta.

Referencia:

- [src/app/page.tsx](src/app/page.tsx)

### 6. useEffect sincroniza con localStorage

Acción:

- Envía uno o más mensajes.
- Revisa `localStorage` en DevTools.

Resultado esperado:

- Existe la clave `neon-nocturne-session-v1`.
- Contiene mensajes, métricas, latencia y modelo.

Referencia:

- [src/app/page.tsx](src/app/page.tsx)

### 7. Los tokens del objeto usage se acumulan

Acción:

- Envía varios mensajes.

Resultado esperado:

- `Prompt Tokens`, `Completion Tokens` y `Total Session Tokens` aumentan a lo largo de la sesión.
- No se reinician salvo que uses `New Session`.

Referencias:

- [src/app/page.tsx](src/app/page.tsx)
- [src/components/chat/MetricsPanel.tsx](src/components/chat/MetricsPanel.tsx)

### 8. La conversación persiste tras recargar y puede borrarse manualmente

Acción:

- Envía mensajes.
- Recarga la pestaña.
- Luego pulsa `New Session`.

Resultado esperado:

- Tras la recarga, el historial y las métricas siguen presentes.
- Al pulsar `New Session`, la sesión vuelve al estado inicial.

Referencias:

- [src/app/page.tsx](src/app/page.tsx)
- [src/components/chat/ChatWindow.tsx](src/components/chat/ChatWindow.tsx)

### 9. Existe al menos una métrica adicional más allá de tokens

Acción:

- Observa el panel derecho de métricas.

Resultado esperado:

- Se muestran `Model Name` y `Response Time` además de los tokens.

Referencia:

- [src/components/chat/MetricsPanel.tsx](src/components/chat/MetricsPanel.tsx)

## Estado actual

- Build validado con `npm run build`
- Integración con Groq implementada por API Route
- Persistencia de sesión implementada
