# Linkup: MVP Spec (working name)

**One-liner:** End the "we should hang out" loop. A friend group picks a time and a place in under two minutes, and the app locks the plan.

**Audience:** Ages 20-35 with scattered friend groups and busy schedules.

## Core loop (the only thing v1 must do well)

1. **Create a group** and invite friends by share link (no account needed to view an invite).
2. **Start a plan** ("Dinner", "Game night", "Hike") with a rough window, such as "next 2 weeks".
3. **Everyone marks availability** by tapping day/time blocks (morning, afternoon, evening).
4. **App surfaces the best slot** (most overlap) and shows who can't make it.
5. **Venue vote**: members suggest places, everyone upvotes, and one wins.
6. **Lock the plan**: it posts to the group and adds to each person's calendar.

Success metric: **time from "start plan" to "locked plan" under 24 hours for 50%+ of plans.**

## Screens (v1)

| Screen | Purpose |
|---|---|
| Welcome / sign-in | Name + phone or Apple sign-in |
| Groups | List of groups, create new |
| Group detail | Members, active plans, past plans |
| New plan | Title, date window, time-of-day options |
| Availability | Tap grid of days x blocks |
| Plan detail | Best-slot summary, venue suggestions and votes, lock button |
| Locked plan | Final time/place, add-to-calendar, share |
| Invite landing | Join via link |

## Data model

- **User**: id, name, avatar, phone/apple id
- **Group**: id, name, memberIds, inviteCode
- **Plan**: id, groupId, title, window (start/end), status (`open` | `locked`), lockedSlot, lockedVenueId
- **Availability**: planId, userId, slots[] (date + block)
- **Venue**: id, planId, name, suggestedBy, votes[]

## Growth hooks (build these in v1)

- **Invite link on every plan**: each plan is a reason to pull in people who aren't on the app yet.
- **Guest availability**: non-users can fill in availability from the link without installing, then get prompted to install.
- **Shareable locked-plan card**: a clean image for group chats and Stories.
- **Nudges**: "3 of 5 have answered. Nudge the rest?" (one tap).

## Out of scope for v1

In-app chat, payments/bill splitting, maps/venue discovery APIs, recurring plans, Android, web.

## Tech

- **App:** Expo (React Native) + TypeScript + Expo Router, iOS first.
- **State:** local store with seeded demo data now. Swap to a backend later.
- **Backend (next step):** Supabase (auth, Postgres, realtime) or Firebase.
- **Ship path:** EAS Build, then TestFlight, then App Store. Requires an Apple Developer account ($99/yr).

## Milestones

1. **Prototype (this repo):** full core loop on-device with local data.
2. **Backend:** real accounts, groups, shared state, invite links.
3. **TestFlight beta:** 5-10 real friend groups, measure the success metric.
4. **App Store launch:** polish, onboarding, ASO, short-form video launch.
