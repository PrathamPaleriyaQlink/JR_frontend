# Jaipur Rugs Frontend

This repository contains the Jaipur Rugs web chatbot and admin dashboard UI.

Production URL:

`https://qlink-jr.vercel.app`

Production alias:

`https://jaipurrugs.claraai.tech`

Main working branch:

`new-changes`

## How The Frontend Connects

The frontend uses one main production HTTP backend:

`https://jaipurrugs-whatsapp-backend.vercel.app`

This is configured in:

`src/lib/api.js`

```js
const BACKEND_ORIGIN =
  import.meta.env.VITE_BACKEND_URL || "https://jaipurrugs-whatsapp-backend.vercel.app";
const WS_BACKEND_ORIGIN =
  import.meta.env.VITE_WS_BACKEND_URL || "https://api.vultr3.qlink.in";
```

Normal dashboard/chatbot APIs go to the WhatsApp backend:

```text
API_WEB_BASE       = https://jaipurrugs-whatsapp-backend.vercel.app/api/web
API_DASHBOARD_BASE = https://jaipurrugs-whatsapp-backend.vercel.app/api
```

Realtime web chat sockets go to the VPS WebSocket backend:

```text
WS_BASE = wss://api.vultr3.qlink.in/ws
```

This split is intentional. Vercel is used for HTTP APIs, while the VPS is used for long-running WebSocket connections.

## Production Flow

```text
Web visitor or dashboard agent
        |
        v
JR_frontend
https://qlink-jr.vercel.app
        |
        | HTTP APIs
        v
WhatsApp backend
https://jaipurrugs-whatsapp-backend.vercel.app
        |
        v
MongoDB, Pinecone, OpenAI, Jaipur Rugs API, Gupshup
```

WhatsApp customers also use the same backend through Gupshup:

```text
WhatsApp customer -> Gupshup -> jaipurrugs-whatsapp-backend.vercel.app
```

## Main Pages

| File | Purpose |
| --- | --- |
| `src/pages/User.jsx` | Web chatbot customer UI |
| `src/pages/AdminWhatsApp.jsx` | WhatsApp conversation dashboard |
| `src/pages/AdminAlerts.jsx` | Agent alerts page |
| `src/pages/AdminHome.jsx` | Dashboard home/insights |
| `src/pages/SystemPrompt.jsx` | Prompt editor |
| `src/pages/KnowledgeBase.jsx` | General KB editor |
| `src/pages/AdminKnowledgeBase.jsx` | Agent KB editor |
| `src/lib/api.js` | Backend and WebSocket URL config |

## WhatsApp Dashboard Behavior

The WhatsApp dashboard polls in the background so agents can receive new messages without manually refreshing.

Important behavior:

- Conversation/message polling should be silent.
- Do not show the full message loader every few seconds after the first load.
- Do not auto-scroll unless a new message is added.
- `Take over` should disable AI and send the customer the handoff message.

Current takeover message:

```text
Thank you. Our rug specialist will assist you further over a call/message.
```

## Local Development

Install dependencies:

```bash
npm install
```

Run dev server:

```bash
npm run dev
```

Build check:

```bash
npm run build
```

## Environment Variables

Optional frontend env vars:

```text
VITE_BACKEND_URL=https://jaipurrugs-whatsapp-backend.vercel.app
VITE_WS_BACKEND_URL=https://api.vultr3.qlink.in
```

If these are not set, the production defaults in `src/lib/api.js` are used.

Do not commit real secrets. Frontend env vars must only contain public browser-safe values.

## Deployment

Deploy frontend after merging/pushing frontend changes:

```bash
vercel deploy --prod --yes
```

Verify production:

```bash
vercel inspect https://qlink-jr.vercel.app
```

## Developer Rules

- Make frontend changes on `new-changes`.
- Keep backend HTTP calls pointed to `jaipurrugs-whatsapp-backend.vercel.app`.
- Backend production logic belongs in `jaipurrugs-whatsapp-backend`, not only in the frontend.
- If a feature needs backend support, add it to the backend `whatsapp-integration-updates` branch first or provide a safe fallback.
- Run `npm run build` before pushing or deploying.
