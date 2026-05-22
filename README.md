# Wandr

Premium luxury travel itinerary app built with Expo, React Native, and TypeScript.

## Features

### Phase 1
- Premium matte-dark design system with frosted glass UI
- Auth flow with Supabase (email/password)
- Home dashboard with hero trips, weather placeholders, recommendations
- Trip management (create, edit, delete)
- Day planner with timeline (morning / afternoon / evening)
- Activity CRUD with reorder
- Offline-ready architecture (MMKV cache + sync queue)
- Full test suite (Jest + React Native Testing Library)

### Phase 2
- **Budget tracker** — expenses vs trip budget target
- **Packing list** — checklist with smart destination suggestions
- **Travel wallet** — document storage with file upload
- **Map explorer** — activity pins (native maps; list fallback on web)
- **Shared trips** — members, email invite codes, share links
- **In-app notifications** — list on profile
- **Live Supabase** — RLS policies, storage buckets, sync flush, NetInfo reconnect
- **Maestro E2E** — starter flows in `tests/e2e/flows/`

## Prerequisites

- Node.js 20+
- npm
- Expo Go app (iOS/Android) or iOS Simulator / Android Emulator
- [Maestro](https://maestro.mobile.dev) (optional, for E2E)

## Quick Start

```bash
npm install
npx expo start
```

Copy `.env.example` to `.env` and add your Supabase credentials before signing in:

## Environment Variables

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Supabase setup (live mode)

Run in order in the Supabase SQL editor:

1. `supabase/schema.sql`
2. `supabase/phase2_extras.sql`
3. `supabase/policies.sql`
4. `supabase/storage.sql`
5. `supabase/auth_trigger.sql` (creates `public.users` on signup)
6. `supabase/realtime_publication.sql` (live updates when collaborators edit a shared trip)
7. `supabase/role_policies.sql` (editor vs viewer permissions)
8. `supabase/trip_archive.sql` (archive trips)
9. `supabase/avatars_storage.sql` (profile photos)
10. `supabase/trip_invites.sql` (pending email invites)
11. `supabase/invite_lookup.sql` (resolve invite codes)
12. `supabase/join_trip_by_invite.sql` (**required** for invite links — lets guests join via code)
13. `supabase/expense_splits.sql` (split expenses among travelers)
14. `supabase/users_co_traveler_policy.sql` (traveler names/avatars on shared trips)
15. `supabase/editor_invite_policies.sql` (editors can invite and share join links)

Invite links use `wandr://trip/join?token=CODE` (or your web URL with the same path).

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start Expo dev server |
| `npm run ios` | Start with iOS |
| `npm test` | Run unit/component/screen tests |
| `npm run test:coverage` | Tests with coverage report |
| `npm run test:e2e` | Maestro E2E flows (requires Maestro CLI) |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm run build:ios:preview` | EAS build for TestFlight (internal) |
| `npm run submit:ios:preview` | Upload latest preview build to TestFlight |

## TestFlight (iOS beta)

Requires [Apple Developer Program](https://developer.apple.com/programs/) ($99/year) and [EAS CLI](https://docs.expo.dev/build/setup/).

**Bundle ID:** `com.wandr.app` (change in `app.json` if needed — must match App Store Connect).

### One-time setup

```bash
npm install -g eas-cli
eas login
eas init          # links this repo to an Expo project (adds projectId to app.json)
```

Register `com.wandr.app` in [App Store Connect](https://appstoreconnect.apple.com/) → create the Wandr app.

Set EAS project secrets (Supabase + Maps):

```bash
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://YOUR_PROJECT.supabase.co"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "YOUR_PUBLISHABLE_KEY"
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_MAPS_API_KEY --value "YOUR_IOS_MAPS_KEY"
```

Restrict the Google Maps key to iOS bundle ID `com.wandr.app` in Google Cloud Console.

### Each TestFlight build

1. Bump `ios.buildNumber` in `app.json` (`"2"`, `"3"`, …).
2. `npm run build:ios:preview`
3. `npm run submit:ios:preview`
4. App Store Connect → **TestFlight** → add internal/external testers when the build is **Ready to Test**.

Install the [TestFlight](https://apps.apple.com/app/testflight/id899247664) app on your iPhone to install builds.

## Architecture

```
app/           Expo Router screens
components/    Shared UI primitives
features/      Feature modules (trips, itinerary, budget, packing, wallet, …)
services/      Supabase, auth, sync, storage, export
stores/        Zustand (auth, UI)
lib/           MMKV, query client, secure store, mappers
theme/         Design tokens, typography, motion
tests/         Unit, component, screen, e2e tests
supabase/      SQL schema, policies, storage
```

The app caches trip data in MMKV for faster loads and offline reads; all writes require a signed-in Supabase session.

## Trip tools

From any trip detail screen, open **Trip Tools**: Budget, Packing, Wallet, Map, and Share (members).
