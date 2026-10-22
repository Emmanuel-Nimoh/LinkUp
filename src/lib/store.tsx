import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useReducer, useState } from 'react';

import { avatarColors } from './theme';
import { AppState, Plan, Slot } from './types';
import { buildDays, slotKey } from './utils';

const STORAGE_KEY = 'linkup:v1';

export type Action =
  | { type: 'hydrate'; state: AppState }
  | { type: 'addGroup'; id: string; name: string; emoji: string; inviteCode: string }
  | { type: 'addMember'; groupId: string; userId: string; name: string }
  | { type: 'addPlan'; id: string; groupId: string; title: string; days: string[] }
  | { type: 'toggleSlot'; planId: string; userId: string; slot: Slot }
  | { type: 'setAvailability'; planId: string; userId: string; slots: Slot[] }
  | { type: 'addVenue'; planId: string; id: string; name: string; userId: string }
  | { type: 'toggleVote'; planId: string; venueId: string; userId: string }
  | { type: 'lockPlan'; planId: string; slot: Slot; venueId?: string };

function seed(): AppState {
  const days = buildDays(14);
  const users = {
    u_me: { id: 'u_me', name: 'You', color: avatarColors[0] },
    u_maya: { id: 'u_maya', name: 'Maya', color: avatarColors[1] },
    u_jordan: { id: 'u_jordan', name: 'Jordan', color: avatarColors[2] },
    u_sam: { id: 'u_sam', name: 'Sam', color: avatarColors[3] },
    u_priya: { id: 'u_priya', name: 'Priya', color: avatarColors[4] },
  };
  const plan: Plan = {
    id: 'p_seed',
    groupId: 'g_seed',
    title: 'Birthday dinner',
    days,
    status: 'open',
    availability: {
      u_maya: [slotKey(days[2], 'evening'), slotKey(days[3], 'evening'), slotKey(days[4], 'evening')],
      u_jordan: [slotKey(days[3], 'evening'), slotKey(days[4], 'evening')],
      u_sam: [slotKey(days[3], 'afternoon'), slotKey(days[4], 'evening')],
    },
    venues: [
      { id: 'v_1', name: 'Taco Libre', suggestedBy: 'u_maya', votes: ['u_maya'] },
      { id: 'v_2', name: 'Ramen House', suggestedBy: 'u_jordan', votes: ['u_jordan', 'u_sam'] },
    ],
    createdAt: Date.now(),
  };
  return {
    meId: 'u_me',
    users,
    groups: [
      {
        id: 'g_seed',
        name: 'Friday Crew',
        emoji: '🍻',
        memberIds: ['u_me', 'u_maya', 'u_jordan', 'u_sam', 'u_priya'],
        inviteCode: 'FRI2026',
      },
    ],
    plans: [plan],
  };
}

function updatePlan(state: AppState, planId: string, fn: (p: Plan) => Plan): AppState {
  return { ...state, plans: state.plans.map((p) => (p.id === planId ? fn(p) : p)) };
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'hydrate':
      return action.state;

    case 'addGroup':
      return {
        ...state,
        groups: [
          ...state.groups,
          {
            id: action.id,
            name: action.name,
            emoji: action.emoji,
            memberIds: [state.meId],
            inviteCode: action.inviteCode,
          },
        ],
      };

    case 'addMember': {
      const color = avatarColors[Object.keys(state.users).length % avatarColors.length];
      return {
        ...state,
        users: { ...state.users, [action.userId]: { id: action.userId, name: action.name, color } },
        groups: state.groups.map((g) =>
          g.id === action.groupId ? { ...g, memberIds: [...g.memberIds, action.userId] } : g,
        ),
      };
    }

    case 'addPlan':
      return {
        ...state,
        plans: [
          {
            id: action.id,
            groupId: action.groupId,
            title: action.title,
            days: action.days,
            status: 'open',
            availability: {},
            venues: [],
            createdAt: Date.now(),
          },
          ...state.plans,
        ],
      };

    case 'toggleSlot':
      return updatePlan(state, action.planId, (p) => {
        const current = p.availability[action.userId] ?? [];
        const next = current.includes(action.slot)
          ? current.filter((s) => s !== action.slot)
          : [...current, action.slot];
        return { ...p, availability: { ...p.availability, [action.userId]: next } };
      });

    case 'setAvailability':
      return updatePlan(state, action.planId, (p) => ({
        ...p,
        availability: { ...p.availability, [action.userId]: action.slots },
      }));

    case 'addVenue':
      return updatePlan(state, action.planId, (p) => ({
        ...p,
        venues: [
          ...p.venues,
          { id: action.id, name: action.name, suggestedBy: action.userId, votes: [action.userId] },
        ],
      }));

    case 'toggleVote':
      return updatePlan(state, action.planId, (p) => ({
        ...p,
        venues: p.venues.map((v) =>
          v.id === action.venueId
            ? {
                ...v,
                votes: v.votes.includes(action.userId)
                  ? v.votes.filter((id) => id !== action.userId)
                  : [...v.votes, action.userId],
              }
            : v,
        ),
      }));

    case 'lockPlan':
      return updatePlan(state, action.planId, (p) => ({
        ...p,
        status: 'locked',
        lockedSlot: action.slot,
        lockedVenueId: action.venueId,
      }));

    default:
      return state;
  }
}

interface StoreValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  ready: boolean;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, seed);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) dispatch({ type: 'hydrate', state: JSON.parse(raw) as AppState });
      } catch {
        // fall back to seed data
      }
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state, ready]);

  const value = useMemo(() => ({ state, dispatch, ready }), [state, ready]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
