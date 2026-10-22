export type Block = 'morning' | 'afternoon' | 'evening';

/** "YYYY-MM-DD|block" */
export type Slot = string;

export interface User {
  id: string;
  name: string;
  color: string;
}

export interface Group {
  id: string;
  name: string;
  emoji: string;
  memberIds: string[];
  inviteCode: string;
}

export interface Venue {
  id: string;
  name: string;
  suggestedBy: string;
  votes: string[];
}

export interface Plan {
  id: string;
  groupId: string;
  title: string;
  /** ISO dates (YYYY-MM-DD) the plan could happen on */
  days: string[];
  status: 'open' | 'locked';
  /** userId -> slots they are free for */
  availability: Record<string, Slot[]>;
  venues: Venue[];
  lockedSlot?: Slot;
  lockedVenueId?: string;
  createdAt: number;
}

export interface AppState {
  meId: string;
  users: Record<string, User>;
  groups: Group[];
  plans: Plan[];
}
