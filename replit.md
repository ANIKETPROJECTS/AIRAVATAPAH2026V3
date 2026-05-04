# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: MongoDB Atlas
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm --filter @workspace/agri-admin run dev` — run admin web app locally (port 5000)
- `pnpm --filter @workspace/farmer-app run web` — run Expo web farmer app (port 3000)
- `pnpm --filter @workspace/api-server run build && PORT=8000 node artifacts/api-server/dist/index.mjs` — run API server

## Artifacts

### AgriAdmin AI — Smart Agriculture Dashboard (`artifacts/agri-admin`)

- **Type**: React + Vite frontend app
- **Port**: 5000 (webview workflow "Start application")
- **Description**: Maharashtra district officer portal — manage farmer registrations, scheme applications, OCR extraction, subsidies, grievances
- **Tech**: React 19, react-router-dom, Tailwind v3, shadcn/ui, Recharts, DM Sans/DM Serif Display fonts
- **Key screens**: Dashboard, New Registration (OCR wizard), Farmer Registry, Scheme Applications, Subsidy Management, Insurance Claims, Grievance Management, Reports & Analytics, Farmer App Preview
- **New Registration module**: 5 document upload cards (Form 7, Form 12, Form 8A, Aadhaar, Bank Passbook); uploads to `/api/extract`, polls `/api/extract/:requestId`, displays structured extracted fields, auto-saves to MongoDB when phone provided
- **Language switching**: Marathi/Hindi/English on New Registration page. Translation maps: `SECTION_TITLE_MAP`, `PROFILE_FIELD_LABEL_MAP`, `PROFILE_SECTION_DOC_LABELS`, `FIELD_LABEL_MAP`, `UI_T`. Helpers: `ui()`, `tSec()`, `tField()`, `tProfileField()`

### API Server (`artifacts/api-server`)

- **Type**: Express 5 API server
- **Port**: 8000 (console workflow "API Server")
- **Routes**:
  - `GET /api/document-types` — list 5 supported document types
  - `POST /api/extract` — upload file (multipart: `file`, `document_type`, `mode`, `profile_phone`); returns `request_id`
  - `GET /api/extract/:requestId` — poll OCR result; auto-saves to MongoDB when `profile_phone` provided
  - `POST /api/auth/send-otp` — send 6-digit OTP to mobile
  - `POST /api/auth/verify-otp` — verify OTP, return JWT + farmer data
  - `GET /api/farmers` — list farmers (query: `status`, `search`, `district`, `page`, `limit`)
  - `GET /api/farmers/by-phone/:phone` — look up farmer by mobile number
  - `GET /api/farmers/:id` — get farmer by farmerId
  - `POST /api/farmers` — create new farmer
  - `PATCH /api/farmers/:id` — update farmer
  - `GET /api/schemes` — list government schemes
  - `GET /api/notifications` — list notifications (query: `mobile`, `farmerId`, `unreadOnly`)
  - `POST /api/notifications/send` — create + push notification (triggers Expo Push Notification to registered device token)
  - `PATCH /api/notifications/:id/read` — mark notification as read
- **MongoDB**: Atlas cluster (`apnaapp` DB); collections: `farmers`, `users`, `schemes`, `notifications`, `push_tokens`, `otps`, `extract_requests`
- **Secrets**: `DATALAB_API_KEY`, `MONGODB_URI`, `SESSION_SECRET`

### Kisan Seva — Farmer Mobile App (`artifacts/farmer-app`)

- **Type**: Expo (React Native) app running in web mode for preview
- **Port**: 3000 (console workflow "Farmer App")
- **Tech**: Expo SDK 53, React Native 0.79, expo-router 4.x, React 19, DM Sans font (matches admin portal)
- **Colors**: Derived from admin portal CSS — primary `#1B4030`, accent `#C79A20`, background `#F4F0E9`, sidebar `#092015`
- **Auth**: Mobile OTP login via `/api/auth/send-otp` and `/api/auth/verify-otp`; JWT stored in expo-secure-store (or localStorage on web)
- **Screens**:
  - `(auth)/welcome` — App intro with features list, "Get Started" CTA
  - `(auth)/otp` — Mobile number entry + 6-digit OTP verification
  - `(tabs)/home` — Dynamic status dashboard (unregistered / pending / active / rejected states)
  - `(tabs)/upload` — 5-document upload wizard with OCR polling (Aadhaar, Bank Passbook, Form 7, Form 12, Form 8A)
  - `(tabs)/profile` — Farmer profile with all extracted fields (personal, land, bank)
  - `(tabs)/schemes` — Government schemes list (locked until verified, shows PM-KISAN etc. after verification)
- **API URL Strategy**: `getApiUrl()` in `lib/query-client.ts` dynamically derives port-8000 URL from current browser hostname at runtime (handles Replit `*.replit.dev` domain pattern by inserting `--8000` before first dot)
- **Document upload**: Uses `expo-document-picker` (PDF/image); POST to `/api/extract` as multipart FormData; polls result every 4 seconds; persists upload state per-mobile in AsyncStorage

## Port Routing
- **Port 5000**: Vite dev server (agri-admin frontend) — webview workflow
- **Port 3000**: Expo Metro web (farmer-app) — console workflow
- **Port 8000**: API server (Express) — console workflow
- **Port 8080→18593**: Redirect handled by `scripts/redirect-8080.mjs`

## Architecture Notes
- Both apps call the same API server on port 8000
- Admin app uses Vite proxy for `/api` → `http://localhost:8000`
- Farmer app derives API URL dynamically from browser hostname at runtime
- MongoDB collections are shared between both apps
- Expo Push Notifications: farmers register push tokens via `/api/auth/verify-otp` response; admin can trigger push via `/api/notifications/send`
