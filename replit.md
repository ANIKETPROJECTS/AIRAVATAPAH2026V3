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
- `pnpm --filter @workspace/kisan-mitra run web` — run Kisan Mitra Expo web app (port 8008)
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
  - `POST /api/auth/send-otp` — send 6-digit OTP to mobile (returns `otp` field in dev mode)
  - `POST /api/auth/verify-otp` — verify OTP, return JWT + farmer data
  - `GET /api/farmers` — list farmers (query: `status`, `search`, `district`, `page`, `limit`)
  - `GET /api/farmers/by-phone/:phone` — look up farmer by mobile number
  - `GET /api/farmers/:id` — get farmer by farmerId
  - `POST /api/farmers` — create new farmer
  - `PATCH /api/farmers/:id` — update farmer
  - `GET /api/schemes` — list government schemes (query: `type`, `search`)
  - `GET /api/notifications` — list notifications (query: `mobile`, `farmerId`, `unreadOnly`)
  - `POST /api/notifications/send` — create + push notification
  - `PATCH /api/notifications/:id/read` — mark notification as read
  - `PATCH /api/notifications/read-all` — mark all notifications read (body: `mobile`)
- **MongoDB**: Atlas cluster (`apnaapp` DB); collections: `farmers`, `users`, `schemes`, `notifications`, `push_tokens`, `otps`, `extract_requests`
- **Secrets**: `DATALAB_API_KEY`, `MONGODB_URI`, `SESSION_SECRET`

### Kisan Mitra — Farmer Mobile App (`artifacts/kisan-mitra`)

- **Type**: Expo (React Native) app running in web mode for preview
- **Port**: 8008 (console workflow "Kisan Mitra")
- **App name**: "Kisan Mitra" / "किसान मित्र" (Farmer Friend)
- **Tech**: Expo SDK 53, React Native 0.79.2, React Navigation v6 (stack + bottom tabs), React 19, no expo-router
- **Colors**: Saffron/orange primary (`#F97316`), white backgrounds, green for success states
- **Languages**: English, Hindi (हिंदी), Marathi (मराठी) — switchable on welcome screen, saved in AsyncStorage
- **Auth**: Mobile OTP login via `/api/auth/send-otp` + `/api/auth/verify-otp`; JWT + farmer data stored in AsyncStorage. Dev mode: OTP auto-displayed in yellow banner on OTP screen (API returns it in response).
- **Navigation flow**:
  - No token → Welcome → Login → OTP
  - Token + no farmer / Rejected → DocumentUpload
  - Token + farmer Pending → PendingScreen (auto-polls every 30s)
  - Token + farmer Active → Main tab navigator (Home / Schemes / Notifications / Profile)
- **Document upload**: 5 required documents (Aadhaar, Bank Passbook, Form 7, Form 12, Form 8A). Each card: pick file (expo-document-picker on web, expo-image-picker on native) → POST `/api/extract` with `profile_phone` → poll `/api/extract/:requestId` every 4s → marks done when `status === 'complete'`. Submit button enabled when all 5 done — fetches updated farmer record and navigates to Pending.
- **Screens**:
  - `WelcomeScreen` — App logo, tagline, language picker, "Get Started" CTA
  - `LoginScreen` — 10-digit mobile number, "Send OTP" button
  - `OtpScreen` — 6-digit OTP input, countdown timer, resend, dev OTP banner
  - `DocumentUploadScreen` — 5 document cards with upload/processing/done states, progress bar
  - `PendingScreen` — Timeline (Submitted → Under Review → Decision), farmer ID, docs list, auto-refresh
  - `HomeScreen` (tab) — Welcome banner, farm summary grid, quick actions, recent notifications
  - `SchemesScreen` (tab) — Scheme list with Central/State filter, search, Know More modal
  - `NotificationsScreen` (tab) — Notification list, mark-as-read, pull to refresh
  - `ProfileScreen` (tab) — Personal / Land / Bank info sections, document list, logout
- **API URL Strategy**: `getApiBase()` in `src/api.ts` — if `localhost` → `http://localhost:8000/api`; otherwise `${protocol}//${hostname}:8000/api` (works in Replit since all ports are accessible at the same hostname)
- **Key files**: `src/api.ts`, `src/types.ts`, `src/constants.ts`, `src/context/AuthContext.tsx`, `src/navigation/AppNavigator.tsx`, `src/screens/`

## Port Routing
- **Port 5000**: Vite dev server (agri-admin frontend) — webview workflow
- **Port 8000**: API server (Express) — console workflow
- **Port 8008**: Expo Metro web (kisan-mitra) — console workflow
- **Port 8080→5000 / Port 18593→5000**: Redirect handled by `scripts/redirect-8080.mjs`

## Architecture Notes
- Admin app (agri-admin) and Farmer app (kisan-mitra) both call the same API server on port 8000
- Admin app uses Vite proxy (`/api` → `http://localhost:8000`) — same-origin requests
- Kisan Mitra derives API URL dynamically from `window.location.hostname:8000` at runtime
- MongoDB collections shared between all apps: `farmers`, `schemes`, `notifications`, `push_tokens`
- Expo Push Notifications: farmers register push tokens; admin triggers push via `/api/notifications/send`
- OTP is returned in API response in dev mode (no SMS gateway) — displayed as yellow banner in OtpScreen
- Document types: `aadhar`, `bank_passbook`, `form7`, `form12`, `form8a`
