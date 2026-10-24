export type AvailabilityStatus = 'available' | 'maybe' | 'busy';

export interface DayAvailability {
  date: string; // "YYYY-MM-DD"
  status: AvailabilityStatus;
  note?: string;
}

export interface Participant {
  id: string;
  eventId: string;
  name: string;
  pinHash: string; // simple hashed/salted 4-digit PIN
  color: string;   // avatar tag color (hex or tailwind key)
  createdAt: string;
}

export interface ParticipantResponse {
  participantId: string;
  eventId: string;
  availability: Record<string, DayAvailability>; // keyed by "YYYY-MM-DD"
  updatedAt: string;
}

export interface TripEvent {
  id: string;
  title: string;
  description?: string;
  destinationHint?: string;
  startDate: string; // "YYYY-MM-DD"
  endDate: string;   // "YYYY-MM-DD"
  defaultDurationDays: number;
  adminKeyHash: string;
  isLocked: boolean;
  lockedWindow?: {
    startDate: string;
    endDate: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface DaySummary {
  date: string;
  availableCount: number;
  maybeCount: number;
  busyCount: number;
  totalParticipants: number;
  score: number; // e.g. available * 1.0 + maybe * 0.5
  percentage: number; // 0 to 100
  notes: Array<{
    participantId: string;
    participantName: string;
    note: string;
    status: AvailabilityStatus;
  }>;
  participants: Array<{
    participantId: string;
    participantName: string;
    color: string;
    status: AvailabilityStatus;
    note?: string;
  }>;
}

export interface TripWindow {
  startDate: string;
  endDate: string;
  durationDays: number;
  averageScore: number;
  minAvailable: number; // worst day availability in window
  fullAttendance: boolean; // all participants available every single day
  attendancePercentage: number;
  daySummaries: DaySummary[];
  unavailableParticipants: Array<{
    id: string;
    name: string;
    daysUnavailable: number;
  }>;
  maybeParticipants?: Array<{
    id: string;
    name: string;
    daysMaybe: number;
  }>;
}
