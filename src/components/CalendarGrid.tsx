import React, { useState, useRef, useEffect } from 'react';
import {
  parseISO,
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
} from 'date-fns';
import {
  DaySummary,
  TripWindow,
  AvailabilityStatus,
  Participant,
  ParticipantResponse,
} from '../types';
import { isDateInWindow } from '../utils/dateCalc';
import { useTranslation } from '../i18n/LanguageContext';
import {
  MessageSquare,
  Sparkles,
  Check,
  CheckCircle2,
  HelpCircle,
  XCircle,
  RotateCcw,
  Users,
} from 'lucide-react';
import { DayNoteModal } from './DayNoteModal';

interface CalendarGridProps {
  startDateStr: string;
  endDateStr: string;
  daySummaries: Record<string, DaySummary>;
  selectedWindow: TripWindow | null;
  currentParticipant: Participant | null;
  myResponse: ParticipantResponse | null;
  onSaveAvailability: (availability: Record<string, { date: string; status: AvailabilityStatus; note?: string }>) => void;
  onSelectDayDetails: (summary: DaySummary) => void;
  onOpenDayNote?: (dateStr: string, currentStatus: AvailabilityStatus, currentNote: string) => void;
}

const WEEKDAYS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const WEEKDAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

function buildInitialAvailability(
  startDateStr: string,
  endDateStr: string,
  existing?: Record<string, { date: string; status: AvailabilityStatus; note?: string }>
): Record<string, { date: string; status: AvailabilityStatus; note?: string }> {
  const result: Record<string, { date: string; status: AvailabilityStatus; note?: string }> = {};
  if (startDateStr && endDateStr) {
    try {
      const start = parseISO(startDateStr);
      const end = parseISO(endDateStr);
      const cur = new Date(start);
      while (cur <= end) {
        const k = format(cur, 'yyyy-MM-dd');
        result[k] = { date: k, status: 'available' };
        cur.setDate(cur.getDate() + 1);
      }
    } catch {}
  }
  return { ...result, ...(existing || {}) };
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  startDateStr,
  endDateStr,
  daySummaries,
  selectedWindow,
  currentParticipant,
  myResponse,
  onSaveAvailability,
  onSelectDayDetails,
}) => {
  const { t, dateLocale, language } = useTranslation();
  const weekdays = language === 'fr' ? WEEKDAYS_FR : WEEKDAYS_EN;

  // View mode tab: 'paint' (personal painter) vs 'heatmap' (overall group calendar)
  const [viewTab, setViewTab] = useState<'paint' | 'heatmap'>(currentParticipant ? 'paint' : 'heatmap');
  const isPaintMode = !!currentParticipant && viewTab === 'paint';
  const [brushTool, setBrushTool] = useState<'available' | 'maybe' | 'busy' | 'note'>('available');
  const [localAvail, setLocalAvail] = useState<Record<string, { date: string; status: AvailabilityStatus; note?: string }>>(() =>
    buildInitialAvailability(startDateStr, endDateStr, myResponse?.availability)
  );
  const [isDirty, setIsDirty] = useState(false);
  const isPointerDown = useRef(false);
  const activeDragStatus = useRef<AvailabilityStatus | null>(null);

  // Internal Day Note Modal state
  const [noteModal, setNoteModal] = useState<{
    isOpen: boolean;
    dateStr: string | null;
    status: AvailabilityStatus;
    note: string;
  }>({
    isOpen: false,
    dateStr: null,
    status: 'available',
    note: '',
  });

  useEffect(() => {
    const noteDate = new URLSearchParams(window.location.search).get('noteDate');
    if (noteDate) {
      setNoteModal({
        isOpen: true,
        dateStr: noteDate,
        status: localAvail[noteDate]?.status || 'available',
        note: localAvail[noteDate]?.note || '',
      });
    }
  }, []);

  // Sync when participant or response changes, preserving uncommitted brushstrokes
  React.useEffect(() => {
    if (!isDirty) {
      setLocalAvail(buildInitialAvailability(startDateStr, endDateStr, myResponse?.availability));
    }
  }, [myResponse, currentParticipant, isDirty, startDateStr, endDateStr]);

  const [quotaExceeded, setQuotaExceeded] = useState(false);

  React.useEffect(() => {
    const handleQuota = () => setQuotaExceeded(true);
    window.addEventListener('vacay_cloud_quota_exceeded', handleQuota);
    return () => window.removeEventListener('vacay_cloud_quota_exceeded', handleQuota);
  }, []);

  // When a user selects a participant, switch to paint mode
  React.useEffect(() => {
    if (currentParticipant) {
      setViewTab('paint');
    } else {
      setViewTab('heatmap');
    }
  }, [currentParticipant?.id]);

  // Compute unique months in range
  const start = parseISO(startDateStr);
  const end = parseISO(endDateStr);

  const months: Date[] = [];
  let currMonth = startOfMonth(start);
  while (currMonth <= end) {
    months.push(currMonth);
    currMonth = new Date(currMonth.getFullYear(), currMonth.getMonth() + 1, 1);
  }

  // Paint interactions (FL Studio channel rack style toggle, or note modal opener)
  const handleCellPointerDown = (dateKey: string) => {
    if (!isPaintMode) return;
    if (brushTool === 'note') {
      const myDay = localAvail[dateKey];
      setNoteModal({
        isOpen: true,
        dateStr: dateKey,
        status: myDay?.status || 'available',
        note: myDay?.note || '',
      });
      return;
    }
    isPointerDown.current = true;
    const curStatus = localAvail[dateKey]?.status || 'available';
    // If cell already matches the active brushTool, toggle it off:
    // If brush is 'available', toggling off sets it to 'busy'.
    // If brush is 'busy' or 'maybe', toggling off restores it to 'available'.
    const toggleOffStatus: AvailabilityStatus = brushTool === 'available' ? 'busy' : 'available';
    const nextStatus: AvailabilityStatus = curStatus === brushTool ? toggleOffStatus : brushTool;
    activeDragStatus.current = nextStatus;
    paintDay(dateKey, nextStatus);
  };

  const handleCellPointerEnter = (dateKey: string) => {
    if (!isPaintMode || !isPointerDown.current || !activeDragStatus.current || brushTool === 'note') return;
    paintDay(dateKey, activeDragStatus.current);
  };

  const handlePointerUp = () => {
    isPointerDown.current = false;
    activeDragStatus.current = null;
  };

  const handleSaveDayNoteInternal = (dateStr: string, status: AvailabilityStatus, note: string) => {
    setLocalAvail((prev) => ({
      ...prev,
      [dateStr]: {
        date: dateStr,
        status,
        note,
      },
    }));
    setIsDirty(true);
  };

  const paintDay = (dateKey: string, status: AvailabilityStatus) => {
    setLocalAvail((prev) => {
      const existing = prev[dateKey];
      return {
        ...prev,
        [dateKey]: {
          date: dateKey,
          status,
          note: existing?.note,
        },
      };
    });
    setIsDirty(true);
  };

  const handleQuickFill = (status: AvailabilityStatus) => {
    const updated = { ...localAvail };
    const cur = new Date(start);
    while (cur <= end) {
      const key = format(cur, 'yyyy-MM-dd');
      const existing = updated[key];
      updated[key] = {
        date: key,
        status,
        note: existing?.note,
      };
      cur.setDate(cur.getDate() + 1);
    }
    setLocalAvail(updated);
    setIsDirty(true);
  };

  const handleReset = () => {
    setLocalAvail(buildInitialAvailability(startDateStr, endDateStr, myResponse?.availability));
    setIsDirty(false);
  };

  const handleSave = () => {
    onSaveAvailability(localAvail);
    setIsDirty(false);
  };

  return (
    <div
      className="space-y-5"
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* Sticky Compact Calendar Controls Toolbar */}
      <div className="sticky top-16 z-20 py-1 bg-white">
        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-zinc-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
          {currentParticipant ? (
            /* Mode Switcher for logged in participants */
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex p-1 bg-zinc-100 rounded-xl border border-zinc-200/80 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setViewTab('paint')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewTab === 'paint'
                      ? 'bg-white text-emerald-900 shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-950'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{t.myDatesTab}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (isDirty) {
                      handleSave();
                    }
                    setViewTab('heatmap');
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewTab === 'heatmap'
                      ? 'bg-white text-indigo-950 shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-950'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{t.groupHeatmapTab}</span>
                </button>
              </div>

              {/* Brush selection (visible when in painter tab) */}
              {viewTab === 'paint' && (
                <div className="flex items-center gap-1.5 pl-1 sm:pl-2 sm:border-l sm:border-zinc-200 shrink-0">
                  <button
                    type="button"
                    onClick={() => setBrushTool('available')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                      brushTool === 'available'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-500/20'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{t.brushFree}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBrushTool('maybe')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                      brushTool === 'maybe'
                        ? 'bg-amber-500 text-white border-amber-500 shadow-xs ring-2 ring-amber-500/20'
                        : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>{t.brushMaybe}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBrushTool('busy')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                      brushTool === 'busy'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs ring-2 ring-rose-500/20'
                        : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>{t.brushBusy}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBrushTool('note')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                      brushTool === 'note'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs ring-2 ring-indigo-500/20'
                        : 'bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{t.brushNote}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Viewer mode Heatmap legend with all indicators */
            <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2 text-xs">
              {/* Availability Scale */}
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-zinc-800 text-[11px] sm:text-xs">{t.heatmapLegend}</span>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-xs bg-zinc-100 border border-zinc-200" title={t.legendNone} />
                  <span className="text-[10px] sm:text-[11px] text-zinc-500">{t.legendNone}</span>
                  <span className="w-2.5 h-2.5 rounded-xs bg-emerald-100 border border-emerald-200" />
                  <span className="w-2.5 h-2.5 rounded-xs bg-emerald-300 border border-emerald-400" />
                  <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" />
                  <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600 ring-1 ring-emerald-400" title={t.legendAll} />
                  <span className="text-[10px] sm:text-[11px] font-bold text-emerald-800">{t.legendAll}</span>
                </div>
              </div>

              {/* Cell Indicators: Sparkles, Maybe dot, Note */}
              <div className="flex flex-wrap items-center gap-2.5 pl-2 sm:pl-3 border-l border-zinc-200 text-[10px] sm:text-[11px] text-zinc-600">
                <span className="inline-flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500 fill-amber-400/30 shrink-0" />
                  <span>{t.legend100Percent}</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400 ring-1 ring-amber-500/20 shrink-0" />
                  <span>{t.legendMaybe}</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <MessageSquare className="w-2.5 h-2.5 text-zinc-500 shrink-0" />
                  <span>{t.legendNote}</span>
                </span>
              </div>
            </div>
          )}

          {/* Right side controls */}
          {currentParticipant && viewTab === 'paint' ? (
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickFill('available')}
                  className="text-[11px] font-semibold text-zinc-600 hover:text-zinc-900 px-2 py-1 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  {t.allFree}
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('busy')}
                  className="text-[11px] font-semibold text-zinc-600 hover:text-zinc-900 px-2 py-1 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  {t.allBusy}
                </button>
                {isDirty && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-[11px] font-semibold text-zinc-500 hover:text-zinc-800 px-2 py-1 rounded-lg hover:bg-zinc-100 transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>{t.resetChanges}</span>
                  </button>
                )}
              </div>
              <button
                type="submit"
                onClick={handleSave}
                className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer w-full sm:w-auto shrink-0 ${
                  isDirty
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-zinc-900 text-white hover:bg-zinc-800'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isDirty ? t.saveChanges : (quotaExceeded ? t.savedLocallyQuota : t.savedToast)}</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Calendar Months Grid */}
      <div id="calendar-months" className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {months.map((monthDate) => {
          const monthStart = startOfMonth(monthDate);
          const monthEnd = endOfMonth(monthDate);
          const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

          // Day of week offset for Monday start
          const startDayOfWeek = (getDay(monthStart) + 6) % 7;
          const leadingBlanks = Array.from({ length: startDayOfWeek });
          const rawMonth = format(monthDate, 'MMMM yyyy', { locale: dateLocale });
          const monthTitle = rawMonth.charAt(0).toUpperCase() + rawMonth.slice(1);

          return (
            <div
              key={monthDate.toISOString()}
              className="bg-white rounded-2xl border border-zinc-200/80 p-4 sm:p-5 shadow-xs"
            >
              {/* Month Header */}
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-base text-zinc-900 tracking-tight">
                  {monthTitle}
                </h3>
              </div>

              {/* Weekday Row */}
              <div className="grid grid-cols-7 gap-1.5 mb-2 text-center">
                {weekdays.map((wd) => (
                  <span
                    key={wd}
                    className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider"
                  >
                    {wd}
                  </span>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2 select-none">
                {leadingBlanks.map((_, i) => (
                  <div key={`blank-${i}`} className="min-h-[58px] sm:min-h-[66px] rounded-xl" />
                ))}

                {daysInMonth.map((dayObj) => {
                  const dateKey = format(dayObj, 'yyyy-MM-dd');
                  const isWithinEvent = dateKey >= startDateStr && dateKey <= endDateStr;
                  const daySummary = daySummaries[dateKey];
                  const isInSelectedWindow =
                    selectedWindow &&
                    isDateInWindow(dateKey, selectedWindow.startDate, selectedWindow.endDate);

                  if (!isWithinEvent) {
                    return (
                      <div
                        key={dateKey}
                        className="min-h-[58px] sm:min-h-[66px] rounded-xl flex items-center justify-center text-xs text-zinc-300 font-medium cursor-not-allowed bg-zinc-50/50"
                      >
                        {format(dayObj, 'd')}
                      </div>
                    );
                  }

                  // If in PAINT MODE
                  if (isPaintMode) {
                    const myDay = localAvail[dateKey];
                    const status = myDay?.status || 'available';
                    const hasNote = !!myDay?.note && myDay.note.trim().length > 0;

                    let bgClass = 'bg-zinc-100 text-zinc-700 border-zinc-200';
                    if (status === 'available') {
                      bgClass = 'bg-emerald-600 text-white border-emerald-600 shadow-xs';
                    } else if (status === 'maybe') {
                      bgClass = 'bg-amber-400 text-amber-950 border-amber-400 shadow-xs';
                    } else if (status === 'busy') {
                      bgClass = 'bg-rose-50 text-rose-700 border-rose-200';
                    }

                    return (
                      <div
                        key={dateKey}
                        onPointerDown={() => handleCellPointerDown(dateKey)}
                        onPointerEnter={() => handleCellPointerEnter(dateKey)}
                        className={`min-h-[52px] sm:min-h-[66px] rounded-xl border flex flex-col items-center justify-between p-1.5 sm:p-2 transition-all cursor-pointer calendar-cell ${bgClass} active:scale-95 ${
                          brushTool === 'note' ? 'hover:ring-2 hover:ring-indigo-400' : ''
                        }`}
                      >
                        <div className="w-full flex items-center justify-between">
                          <span className="text-xs font-bold leading-none">
                            {format(dayObj, 'd')}
                          </span>
                          {hasNote && (
                            <button
                              type="button"
                              onPointerDown={(e) => e.stopPropagation()}
                              onMouseDown={(e) => e.stopPropagation()}
                              onTouchStart={(e) => e.stopPropagation()}
                              onClick={(e) => {
                                e.stopPropagation();
                                setNoteModal({
                                  isOpen: true,
                                  dateStr: dateKey,
                                  status,
                                  note: myDay?.note || '',
                                });
                              }}
                              className={`p-0.5 sm:p-1 rounded-md transition-transform hover:scale-110 cursor-pointer ${
                                status === 'available'
                                  ? 'text-white bg-emerald-700/80 ring-1 ring-white/40'
                                  : status === 'maybe'
                                  ? 'text-amber-950 bg-amber-500/60 ring-1 ring-amber-900/30'
                                  : 'text-rose-900 bg-rose-200/80 ring-1 ring-rose-400/40'
                              }`}
                              title={`Note: ${myDay?.note}`}
                            >
                              <MessageSquare className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <span className="hidden sm:block text-[10px] font-bold uppercase tracking-normal opacity-90 leading-tight text-center">
                          {status === 'available' ? t.brushFree : status === 'maybe' ? t.brushMaybe : t.brushBusy}
                        </span>
                        <span
                          className="sm:hidden text-xs font-bold leading-none text-center opacity-90"
                          aria-label={status === 'available' ? t.brushFree : status === 'maybe' ? t.brushMaybe : t.brushBusy}
                        >
                          {status === 'available' ? '✓' : status === 'maybe' ? '?' : '–'}
                        </span>
                      </div>
                    );
                  }

                  // HEATMAP VIEW MODE: Clean, decluttered, no conflicting percentages!
                  const availableCount = daySummary ? daySummary.availableCount : 0;
                  const maybeCount = daySummary ? daySummary.maybeCount : 0;
                  const total = daySummary ? daySummary.totalParticipants : 0;
                  const hasNotes = daySummary && daySummary.notes.length > 0;
                  const is100Percent = total > 0 && availableCount === total;

                  // Color gradient strictly based on attendance
                  let cellColor = 'bg-zinc-50 text-zinc-700 border-zinc-200/70 hover:bg-zinc-100';
                  if (total > 0) {
                    if (is100Percent) {
                      cellColor = 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs';
                    } else if (availableCount >= Math.ceil(total * 0.7)) {
                      cellColor = 'bg-emerald-500 text-white border-emerald-500 font-semibold';
                    } else if (availableCount >= Math.ceil(total * 0.4) || (availableCount > 0 && maybeCount > 0)) {
                      cellColor = 'bg-emerald-200 text-emerald-950 border-emerald-300 font-medium';
                    } else if (availableCount > 0 || maybeCount > 0) {
                      cellColor = 'bg-emerald-50 text-emerald-900 border-emerald-200/80';
                    } else {
                      cellColor = 'bg-zinc-100 text-zinc-500 border-zinc-200';
                    }
                  }

                  const handleSelectDay = () => {
                    const summary: DaySummary = daySummary || {
                      date: dateKey,
                      availableCount: 0,
                      maybeCount: 0,
                      busyCount: 0,
                      totalParticipants: total,
                      score: 0,
                      percentage: 0,
                      notes: [],
                      participants: [],
                    };
                    onSelectDayDetails(summary);
                  };

                  return (
                    <button
                      key={dateKey}
                      type="button"
                      onClick={handleSelectDay}
                      className={`min-h-[52px] sm:min-h-[66px] rounded-xl border flex flex-col items-center justify-between p-1.5 sm:p-2 transition-all text-left cursor-pointer calendar-cell ${cellColor} ${
                        isInSelectedWindow
                          ? 'ring-3 ring-indigo-500 ring-offset-2 scale-[1.03] z-10 shadow-md'
                          : 'hover:scale-[1.02]'
                      }`}
                    >
                      {/* Top row: Date Number + Note icon if hasNotes + 100% Sparkle OR subtle Amber Dot for Maybes */}
                      <div className="w-full flex items-center justify-between">
                        <span className="text-xs font-bold leading-none">
                          {format(dayObj, 'd')}
                        </span>
                        <div className="flex items-center gap-1">
                          {hasNotes && (
                            <span title={t.chatNoteTooltip} className="inline-flex">
                              <MessageSquare className="w-3 h-3 text-current opacity-80 shrink-0" />
                            </span>
                          )}
                          {is100Percent ? (
                            <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300/30 shrink-0" />
                          ) : maybeCount > 0 ? (
                            <span
                              className="w-2 h-2 rounded-full bg-amber-400 ring-1 ring-white/50 shrink-0"
                              title={`${maybeCount} friend(s) marked maybe`}
                            />
                          ) : null}
                        </div>
                      </div>

                      {/* Bottom row: Clean fraction only (Zero visual clutter) */}
                      <div className="w-full flex items-center justify-start">
                        <span className="text-[12px] font-bold tracking-tight">
                          {total > 0 ? `${availableCount}/${total}` : '-'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Internal Day Note Modal so painted changes are NEVER lost */}
      <DayNoteModal
        isOpen={noteModal.isOpen}
        onClose={() => setNoteModal(prev => ({ ...prev, isOpen: false }))}
        dateStr={noteModal.dateStr}
        currentStatus={noteModal.status}
        currentNote={noteModal.note}
        onSave={handleSaveDayNoteInternal}
      />
    </div>
  );
};
