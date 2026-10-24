import { TripEvent, Participant, ParticipantResponse } from '../types';
import { hashString } from '../utils/security';

const STORAGE_PREFIX = 'vacayfree_';

export interface EventDataPackage {
  event: TripEvent;
  participants: Participant[];
  responses: ParticipantResponse[];
}

export const StorageService = {
  getEvent(eventId: string): EventDataPackage | null {
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}event_${eventId}`);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.error('Failed to get event from localStorage', e);
      return null;
    }
  },

  async fetchCloudEvent(eventId: string): Promise<EventDataPackage | null> {
    try {
      const res = await fetch(`/api/event?id=${encodeURIComponent(eventId)}`);
      if (res.ok) {
        const data = await res.json() as EventDataPackage;
        if (data && data.event && data.event.id) {
          this.saveEvent(data, false); // save locally without re-pushing
          return data;
        }
      }
    } catch {
      // Cloudflare Pages Function not active or offline; smoothly fallback to local
    }
    return null;
  },

  saveEvent(data: EventDataPackage, pushToCloud: boolean = true): void {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}event_${data.event.id}`, JSON.stringify(data));
      // Also maintain list of recent events
      const recent = this.getRecentEvents();
      const updatedRecent = [
        data.event.id,
        ...recent.filter(id => id !== data.event.id),
      ].slice(0, 10);
      localStorage.setItem(`${STORAGE_PREFIX}recent_events`, JSON.stringify(updatedRecent));

      // Attempt async cloud sync for multi-device collaboration on Cloudflare Pages
      if (pushToCloud) {
        fetch('/api/event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }).catch(() => {
          // Ignore offline / local development failures
        });
      }
    } catch (e) {
      console.error('Failed to save event to localStorage', e);
    }
  },

  getRecentEvents(): string[] {
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}recent_events`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  // Save admin key locally for creator recognition
  saveAdminKey(eventId: string, adminKey: string): void {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}admin_${eventId}`, adminKey);
    } catch (e) {
      console.error('Failed to save admin key', e);
    }
  },

  getAdminKey(eventId: string): string | null {
    try {
      return localStorage.getItem(`${STORAGE_PREFIX}admin_${eventId}`);
    } catch {
      return null;
    }
  },

  // Save current participant session
  saveParticipantSession(eventId: string, participantId: string, pin: string): void {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}session_${eventId}`, JSON.stringify({ participantId, pin }));
    } catch (e) {
      console.error('Failed to save session', e);
    }
  },

  getParticipantSession(eventId: string): { participantId: string; pin: string } | null {
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}session_${eventId}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
};

/**
 * Creates seed demo data to allow immediate exploration
 */
export async function createDemoEvent(): Promise<EventDataPackage> {
  const adminKey = 'super-secret-demo-admin';
  const adminKeyHash = await hashString(adminKey);

  const now = new Date();
  const currentYear = now.getFullYear();
  const startDate = `${currentYear}-07-01`;
  const endDate = `${currentYear}-08-15`;

  const event: TripEvent = {
    id: 'demo-summer-trip',
    title: 'Summer Getaway ☀️',
    description: 'Finding the best week for our summer vacation rental house!',
    destinationHint: 'Coast or Mountains',
    startDate,
    endDate,
    defaultDurationDays: 7,
    adminKeyHash,
    isLocked: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const pinHash = await hashString('1234');

  const participants: Participant[] = [
    {
      id: 'p-alex',
      eventId: event.id,
      name: 'Alex',
      pinHash,
      color: 'bg-indigo-600',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'p-sam',
      eventId: event.id,
      name: 'Sam',
      pinHash,
      color: 'bg-emerald-600',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'p-charlie',
      eventId: event.id,
      name: 'Charlie',
      pinHash,
      color: 'bg-amber-600',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'p-taylor',
      eventId: event.id,
      name: 'Taylor',
      pinHash,
      color: 'bg-rose-600',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'p-jordan',
      eventId: event.id,
      name: 'Jordan',
      pinHash,
      color: 'bg-purple-600',
      createdAt: new Date().toISOString(),
    },
  ];

  // Populate realistic sample availability for demo
  const responses: ParticipantResponse[] = participants.map((p, pIndex) => {
    const availability: Record<string, { date: string; status: 'available' | 'maybe' | 'busy'; note?: string }> = {};

    const start = new Date(startDate);
    const end = new Date(endDate);
    const cur = new Date(start);

    while (cur <= end) {
      const dateStr = cur.toISOString().split('T')[0];
      const dayOfMonth = cur.getDate();
      const month = cur.getMonth() + 1; // 7 = July, 8 = August

      let status: 'available' | 'maybe' | 'busy' = 'busy';
      let note: string | undefined = undefined;

      if (month === 7) {
        // July
        if (dayOfMonth >= 18 && dayOfMonth <= 25) {
          // Sweet spot: almost everyone free!
          if (pIndex === 3 && dayOfMonth === 25) {
            status = 'maybe';
            note = 'Might need to catch an evening train';
          } else {
            status = 'available';
          }
        } else if (dayOfMonth >= 11 && dayOfMonth <= 17) {
          if (pIndex === 0 || pIndex === 1 || pIndex === 4) {
            status = 'available';
          } else if (pIndex === 2) {
            status = 'maybe';
            note = 'Can work remotely';
          } else {
            status = 'busy';
          }
        } else if (dayOfMonth >= 26 && dayOfMonth <= 31) {
          if (pIndex === 1 || pIndex === 2 || pIndex === 3) {
            status = 'available';
          } else {
            status = 'busy';
            note = 'Family wedding';
          }
        } else {
          // Early July
          if (pIndex === 0 || pIndex === 4) {
            status = 'maybe';
          } else {
            status = 'busy';
          }
        }
      } else {
        // August
        if (dayOfMonth <= 7) {
          if (pIndex === 0 || pIndex === 2 || pIndex === 3) {
            status = 'available';
          } else {
            status = 'maybe';
          }
        } else {
          status = 'busy';
        }
      }

      availability[dateStr] = { date: dateStr, status, note };
      cur.setDate(cur.getDate() + 1);
    }

    return {
      participantId: p.id,
      eventId: event.id,
      availability,
      updatedAt: new Date().toISOString(),
    };
  });

  const demoData: EventDataPackage = { event, participants, responses };
  StorageService.saveEvent(demoData, false);
  StorageService.saveAdminKey(event.id, adminKey);
  return demoData;
}
