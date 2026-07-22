# Jaipur Rugs Frontend

Web chatbot + admin dashboard UI.

Production URL: `https://qlink-jr.vercel.app`  
Alias: `https://jaipurrugs.claraai.tech`  
Working branch: `new-changes`

## Backend (single host)

All HTTP and WebSocket traffic goes to the **Vultr** backend:

`https://api.vultr3.qlink.in`

Configured in `src/lib/api.js`:

```js
const BACKEND_ORIGIN =
  import.meta.env.VITE_BACKEND_URL || "https://api.vultr3.qlink.in";
const WS_BACKEND_ORIGIN =
  import.meta.env.VITE_WS_BACKEND_URL || BACKEND_ORIGIN;
```

```text
API_WEB_BASE       = https://api.vultr3.qlink.in/api/web
API_DASHBOARD_BASE = https://api.vultr3.qlink.in/api
WS_BASE            = wss://api.vultr3.qlink.in/ws
```

WhatsApp customers use the same backend via Gupshup:

```text
WhatsApp → Gupshup → https://api.vultr3.qlink.in/gupshup/message/hc
```

Do not point production at a separate Vercel WhatsApp backend.

## Main Pages

| File | Purpose |
| --- | --- |
| `src/pages/User.jsx` | Web chatbot customer UI |
| `src/pages/AdminWhatsApp.jsx` | WhatsApp conversation dashboard |
| `src/pages/AdminAlerts.jsx` | Agent alerts |
| `src/pages/AdminHome.jsx` | Dashboard home |
| `src/pages/SystemPrompt.jsx` | Prompt editor |
| `src/lib/api.js` | Backend / WebSocket URL config |

## Local Development

```bash
npm install
npm run dev
npm run build
```

Optional env:

```text
VITE_BACKEND_URL=https://api.vultr3.qlink.in
VITE_WS_BACKEND_URL=https://api.vultr3.qlink.in
```

## Deployment

```bash
vercel deploy --prod --yes
vercel inspect https://qlink-jr.vercel.app
```

## Developer Rules

- Make frontend changes on `new-changes`.
- Keep API + WS pointed at `api.vultr3.qlink.in`.
- Backend changes belong in `JR_bot_backend` (`jr-production`), not a dual WhatsApp deploy.
- Run `npm run build` before pushing or deploying.
