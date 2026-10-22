# Linkup

Friend-group planning for ages 20-35. Everyone taps when they're free, Linkup surfaces the best time, the group votes on a place, and the plan locks. See [SPEC.md](./SPEC.md) for the full MVP scope.

Working name. Expo SDK 58, React Native, TypeScript, Expo Router (iOS first).

## Run it

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go, or press `i` for the iOS simulator. The app ships with demo data (a "Friday Crew" group and an open "Birthday dinner" plan) and saves changes on-device.

"Add to calendar" uses `expo-calendar`, which is not in Expo Go. Build a development build to try it:

```bash
npx expo run:ios
```

## Layout

```
src/app/            Expo Router routes
  index.tsx           Groups list
  group/[groupId]/    Group detail, new plan
  plan/[planId]/      Plan detail (best time, venue vote, lock), availability grid
src/components/ui.tsx  Shared UI pieces
src/lib/              Types, store (reducer + AsyncStorage), date/best-slot logic, calendar
```

## Checks

```bash
npx tsc --noEmit
npx expo lint
```

## Status

Prototype of the core loop with local data. Next: backend (Supabase or Firebase) for real accounts, shared groups, and invite links.

## Ship path

EAS Build, then TestFlight, then the App Store. Needs an Apple Developer account.
