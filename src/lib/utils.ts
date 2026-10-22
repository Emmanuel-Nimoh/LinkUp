import { Block, Plan, Slot, Venue } from './types';

export const BLOCKS: Block[] = ['morning', 'afternoon', 'evening'];

export const BLOCK_LABEL: Record<Block, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
};

/** Local start hour used when a slot becomes a calendar event */
export const BLOCK_HOUR: Record<Block, number> = {
  morning: 10,
  afternoon: 14,
  evening: 19,
};

export const uid = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

export const inviteCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

export function toISO(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function fromISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** `count` consecutive days starting tomorrow */
export function buildDays(count: number, from: Date = new Date()): string[] {
  const out: string[] = [];
  for (let i = 1; i <= count; i++) {
    out.push(toISO(new Date(from.getFullYear(), from.getMonth(), from.getDate() + i)));
  }
  return out;
}

export function formatDay(iso: string): string {
  return fromISO(iso).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export const slotKey = (iso: string, block: Block): Slot => `${iso}|${block}`;

export function parseSlot(slot: Slot): { iso: string; block: Block } {
  const [iso, block] = slot.split('|');
  return { iso, block: block as Block };
}

export function formatSlot(slot: Slot): string {
  const { iso, block } = parseSlot(slot);
  return `${formatDay(iso)} · ${BLOCK_LABEL[block]}`;
}

export function slotStart(slot: Slot): Date {
  const { iso, block } = parseSlot(slot);
  const d = fromISO(iso);
  d.setHours(BLOCK_HOUR[block], 0, 0, 0);
  return d;
}

export interface BestSlot {
  slot: Slot;
  count: number;
  total: number;
  /** member ids who are not free for this slot */
  missing: string[];
}

/** Slot with the most members free. Ties go to the earliest slot. */
export function bestSlot(plan: Plan, memberIds: string[]): BestSlot | null {
  let best: BestSlot | null = null;
  for (const iso of plan.days) {
    for (const block of BLOCKS) {
      const slot = slotKey(iso, block);
      const free = memberIds.filter((id) => plan.availability[id]?.includes(slot));
      if (free.length === 0) continue;
      if (!best || free.length > best.count) {
        best = {
          slot,
          count: free.length,
          total: memberIds.length,
          missing: memberIds.filter((id) => !free.includes(id)),
        };
      }
    }
  }
  return best;
}

export function respondedIds(plan: Plan, memberIds: string[]): string[] {
  return memberIds.filter((id) => (plan.availability[id]?.length ?? 0) > 0);
}

/** Venue with the most votes (needs at least one). Ties go to the earliest suggestion. */
export function topVenue(plan: Plan): Venue | null {
  let top: Venue | null = null;
  for (const v of plan.venues) {
    if (v.votes.length > 0 && (!top || v.votes.length > top.votes.length)) top = v;
  }
  return top;
}

/** Random availability for demo purposes (call outside reducers) */
export function makeDemoAvailability(days: string[]): Slot[] {
  const out: Slot[] = [];
  for (const iso of days) {
    for (const block of BLOCKS) {
      const p = block === 'evening' ? 0.5 : block === 'afternoon' ? 0.3 : 0.2;
      if (Math.random() < p) out.push(slotKey(iso, block));
    }
  }
  if (out.length === 0 && days.length > 0) out.push(slotKey(days[0], 'evening'));
  return out;
}
