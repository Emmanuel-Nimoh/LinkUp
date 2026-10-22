@AGENTS.md

# Linkup

Mobile app (Expo SDK 58, Expo Router, TypeScript) that helps friend groups lock a plan fast. Product scope is in `SPEC.md`; run instructions are in `README.md`.

## Conventions

- Routes live in `src/app/`; shared code lives in `src/lib/` and `src/components/`.
- App state is a reducer in `src/lib/store.tsx`. Keep reducers pure: generate ids and random values at the call site and pass them in the action.
- Best-time and venue logic is in `src/lib/utils.ts`.
- `expo-calendar` is not in Expo Go and is loaded lazily in `src/lib/calendar.ts`.
- `npx expo install` can fail in sandboxed environments. If so, take versions from `node_modules/expo/bundledNativeModules.json` and install with npm.

## Next up

1. Backend (Supabase or Firebase): auth, groups, plans, realtime availability.
2. Real invite links with guest availability (no install needed).
3. Shareable locked-plan card image.
4. App icon, splash, onboarding, then EAS Build and TestFlight.
