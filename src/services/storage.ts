import { TripEvent, Participant, ParticipantResponse } from '../types';
import { hashAdminKey, hashParticipantPin } from '../utils/security';
import { getDatesInRange } from '../utils/dateCalc';
import { format } from 'date-fns';

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
          // Merge with any local participant sessions
          this.saveEvent(data, false);
          return data;
        }
      }
    } catch {
      // Cloudflare Pages Function not active or offline; fallback to local
    }
    return null;
  },

  saveEvent(data: EventDataPackage, pushToCloud: boolean = true): void {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}event_${data.event.id}`, JSON.stringify(data));
      const recent = this.getRecentEvents();
      const updatedRecent = [
        data.event.id,
        ...recent.filter(id => id !== data.event.id),
      ].slice(0, 10);
      localStorage.setItem(`${STORAGE_PREFIX}recent_events`, JSON.stringify(updatedRecent));

      if (pushToCloud) {
        // Full event initialization or admin update
        fetch('/api/event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }).catch(() => {});
      }
    } catch (e) {
      console.error('Failed to save event to localStorage', e);
    }
  },

  /**
   * Concurrency-safe delta save: Only syncs this specific friend's response.
   * Completely eliminates last-write-wins collisions when 5 friends save simultaneously!
   */
  async saveParticipantResponseDelta(
    eventId: string,
    participant: Participant,
    response: ParticipantResponse,
    pin: string
  ): Promise<void> {
    try {
      // 1. Update locally immediately
      const data = this.getEvent(eventId);
      if (data) {
        const existingIdx = data.responses.findIndex(r => r.participantId === participant.id);
        if (existingIdx >= 0) {
          data.responses[existingIdx] = response;
        } else {
          data.responses.push(response);
        }
        if (!data.participants.some(p => p.id === participant.id)) {
          data.participants.push(participant);
        }
        localStorage.setItem(`${STORAGE_PREFIX}event_${eventId}`, JSON.stringify(data));
      }

      // 2. Send delta write to edge API
      fetch('/api/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_response',
          eventId,
          participant,
          response,
          pin,
        }),
      }).catch(() => {});
    } catch (e) {
      console.error('Failed to save participant response delta', e);
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
 * Creates seed demo data using 100% timezone-safe date-fns parsing
 */
export async function createDemoEvent(): Promise<EventDataPackage> {
  const adminKey = 'super-secret-demo-admin';
  const eventId = 'demo-summer-trip';
  const adminKeyHash = await hashAdminKey(eventId, adminKey);

  const now = new Date();
  const currentYear = now.getFullYear();
  const startDate = `${currentYear}-07-01`;
  const endDate = `${currentYear}-08-15`;

  const event: TripEvent = {
    id: eventId,
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

  const participants: Participant[] = [
    {
      id: 'p-alex',
      eventId: event.id,
      name: 'Alex',
      pinHash: await hashParticipantPin(eventId, 'p-alex', '1234'),
      color: 'bg-indigo-600',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'p-sam',
      eventId: event.id,
      name: 'Sam',
      pinHash: await hashParticipantPin(eventId, 'p-sam', '1234'),
      color: 'bg-emerald-600',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'p-charlie',
      eventId: event.id,
      name: 'Charlie',
      pinHash: await hashParticipantPin(eventId, 'p-charlie', '1234'),
      color: 'bg-amber-600',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'p-taylor',
      eventId: event.id,
      name: 'Taylor',
      pinHash: await hashParticipantPin(eventId, 'p-taylor', '1234'),
      color: 'bg-rose-600',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'p-jordan',
      eventId: event.id,
      name: 'Jordan',
      pinHash: await hashParticipantPin(eventId, 'p-jordan', '1234'),
      color: 'bg-purple-600',
      createdAt: new Date().toISOString(),
    },
  ];

  // Timezone-safe date list generation
  const demoDates = getDatesInRange(startDate, endDate);

  const responses: ParticipantResponse[] = participants.map((p, pIndex) => {
    const availability: Record<string, { date: string; status: 'available' | 'maybe' | 'busy'; note?: string }> = {};

    for (const d of demoDates) {
      const dateStr = format(d, 'yyyy-MM-dd');
      const dayOfMonth = d.getDate();
      const month = d.getMonth() + 1;

      let status: 'available' | 'maybe' | 'busy' = 'busy';
      let note: string | undefined = undefined;

      if (month === 7) {
        if (dayOfMonth >= 18 && dayOfMonth <= 25) {
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
          if (pIndex === 0 || pIndex === 4) {
            status = 'maybe';
          } else {
            status = 'busy';
          }
        }
      } else {
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
