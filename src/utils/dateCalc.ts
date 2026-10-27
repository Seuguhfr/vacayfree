import {
  parseISO,
  format,
  eachDayOfInterval,
} from 'date-fns';
import { Locale } from 'date-fns/locale';
import {
  Participant,
  ParticipantResponse,
  DaySummary,
  TripWindow,
  AvailabilityStatus,
} from '../types';

export function getDatesInRange(startDateStr: string, endDateStr: string): Date[] {
  const start = parseISO(startDateStr);
  const end = parseISO(endDateStr);
  if (start > end) return [];
  return eachDayOfInterval({ start, end });
}

export function formatDateSafe(date: Date | string, formatPattern: string, locale?: Locale): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, formatPattern, { locale });
}

export function formatWindowRange(startDateStr: string, endDateStr: string, locale?: Locale): string {
  const start = parseISO(startDateStr);
  const end = parseISO(endDateStr);

  const sameYear = start.getFullYear() === end.getFullYear();
  const sameMonth = sameYear && start.getMonth() === end.getMonth();
  const isFr = locale?.code?.startsWith('fr');

  if (sameMonth) {
    return isFr
      ? `${format(start, 'd', { locale })} – ${format(end, 'd MMM yyyy', { locale })}`
      : `${format(start, 'MMM d', { locale })} – ${format(end, 'd, yyyy', { locale })}`;
  } else if (sameYear) {
    return isFr
      ? `${format(start, 'd MMM', { locale })} – ${format(end, 'd MMM yyyy', { locale })}`
      : `${format(start, 'MMM d', { locale })} – ${format(end, 'MMM d, yyyy', { locale })}`;
  } else {
    return isFr
      ? `${format(start, 'd MMM yyyy', { locale })} – ${format(end, 'd MMM yyyy', { locale })}`
      : `${format(start, 'MMM d, yyyy', { locale })} – ${format(end, 'MMM d, yyyy', { locale })}`;
  }
}

/**
 * Calculates aggregated day-by-day availability across all participants
 */
export function calculateDaySummaries(
  dates: Date[],
  participants: Participant[],
  responses: ParticipantResponse[]
): Record<string, DaySummary> {
  const summaries: Record<string, DaySummary> = {};
  const total = participants.length;

  const responseMap = new Map(responses.map(r => [r.participantId, r.availability]));

  for (const dateObj of dates) {
    const dateKey = format(dateObj, 'yyyy-MM-dd');
    let availableCount = 0;
    let maybeCount = 0;
    let busyCount = 0;
    const notes: DaySummary['notes'] = [];
    const participantDetails: DaySummary['participants'] = [];

    for (const p of participants) {
      const pAvailMap = responseMap.get(p.id);
      const dayAvail = pAvailMap?.[dateKey];
      const status: AvailabilityStatus = dayAvail?.status || 'available';

      if (status === 'available') {
        availableCount++;
      } else if (status === 'maybe') {
        maybeCount++;
      } else {
        busyCount++;
      }

      if (dayAvail?.note && dayAvail.note.trim().length > 0) {
        notes.push({
          participantId: p.id,
          participantName: p.name,
          note: dayAvail.note.trim(),
          status,
        });
      }

      participantDetails.push({
        participantId: p.id,
        participantName: p.name,
        color: p.color,
        status,
        note: dayAvail?.note,
      });
    }

    // Score: Available = 1.0, Maybe = 0.5, Busy = 0.0
    const rawScore = total > 0 ? (availableCount * 1.0 + maybeCount * 0.5) / total : 0;
    const percentage = Math.round(rawScore * 100);

    summaries[dateKey] = {
      date: dateKey,
      availableCount,
      maybeCount,
      busyCount,
      totalParticipants: total,
      score: rawScore,
      percentage,
      notes,
      participants: participantDetails,
    };
  }

  return summaries;
}

/**
 * Smart Sliding Window Algorithm to find continuous trip windows of length `durationDays`
 */
export function calculateTripWindows(
  startDateStr: string,
  endDateStr: string,
  durationDays: number,
  participants: Participant[],
  responses: ParticipantResponse[]
): TripWindow[] {
  if (durationDays < 1) return [];

  const allDates = getDatesInRange(startDateStr, endDateStr);
  const totalDays = allDates.length;
  if (totalDays < durationDays) return [];

  const summaries = calculateDaySummaries(allDates, participants, responses);
  const participantMap = new Map(participants.map(p => [p.id, p]));
  const responseMap = new Map(responses.map(r => [r.participantId, r.availability]));
  const totalParticipants = participants.length;

  const windows: TripWindow[] = [];
  const maxStartIndex = totalDays - durationDays;

  for (let i = 0; i <= maxStartIndex; i++) {
    const windowDates = allDates.slice(i, i + durationDays);
    const winStartStr = format(windowDates[0], 'yyyy-MM-dd');
    const winEndStr = format(windowDates[windowDates.length - 1], 'yyyy-MM-dd');

    let sumScore = 0;
    let minAvail = totalParticipants;
    const daySummaries: DaySummary[] = [];

    // Distinct tracking for Busy vs Maybe
    const participantBusyDays = new Map<string, number>();
    const participantMaybeDays = new Map<string, number>();

    for (const d of windowDates) {
      const dateKey = format(d, 'yyyy-MM-dd');
      const daySummary = summaries[dateKey];
      daySummaries.push(daySummary);
      sumScore += daySummary.score;
      if (daySummary.availableCount < minAvail) {
        minAvail = daySummary.availableCount;
      }

      // Check each participant status
      for (const p of participants) {
        const pStatus = responseMap.get(p.id)?.[dateKey]?.status || 'available';
        if (pStatus === 'busy') {
          const count = participantBusyDays.get(p.id) || 0;
          participantBusyDays.set(p.id, count + 1);
        } else if (pStatus === 'maybe') {
          const count = participantMaybeDays.get(p.id) || 0;
          participantMaybeDays.set(p.id, count + 1);
        }
      }
    }

    const avgScore = sumScore / durationDays;
    const attendancePercentage = Math.round(avgScore * 100);
    const fullAttendance = totalParticipants > 0 && participantBusyDays.size === 0 && participantMaybeDays.size === 0;

    const unvailableList = Array.from(participantBusyDays.entries()).map(
      ([id, daysUnavailable]) => ({
        id,
        name: participantMap.get(id)?.name || 'Unknown',
        daysUnavailable,
      })
    );

    const maybeList = Array.from(participantMaybeDays.entries()).map(
      ([id, daysMaybe]) => ({
        id,
        name: participantMap.get(id)?.name || 'Unknown',
        daysMaybe,
      })
    );

    windows.push({
      startDate: winStartStr,
      endDate: winEndStr,
      durationDays,
      averageScore: avgScore,
      minAvailable: totalParticipants > 0 ? minAvail : 0,
      fullAttendance,
      attendancePercentage,
      daySummaries,
      unavailableParticipants: unvailableList.sort((a, b) => b.daysUnavailable - a.daysUnavailable),
      maybeParticipants: maybeList.sort((a, b) => b.daysMaybe - a.daysMaybe),
    });
  }

  // Sort windows by:
  // 1. Full attendance first
  // 2. Average score (descending)
  // 3. Minimum available bottleneck (descending)
  // 4. Start date (chronological)
  windows.sort((a, b) => {
    if (a.fullAttendance !== b.fullAttendance) {
      return a.fullAttendance ? -1 : 1;
    }
    if (Math.abs(b.averageScore - a.averageScore) > 0.001) {
      return b.averageScore - a.averageScore;
    }
    if (b.minAvailable !== a.minAvailable) {
      return b.minAvailable - a.minAvailable;
    }
    return a.startDate.localeCompare(b.startDate);
  });

  return windows;
}

export function isDateInWindow(dateStr: string, windowStart: string, windowEnd: string): boolean {
  return dateStr >= windowStart && dateStr <= windowEnd;
}
