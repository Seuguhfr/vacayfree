import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  TripEvent,
  Participant,
  ParticipantResponse,
  DaySummary,
  TripWindow,
  AvailabilityStatus,
} from './types';
import {
  calculateDaySummaries,
  calculateTripWindows,
  getDatesInRange,
  formatWindowRange,
} from './utils/dateCalc';
import { hashString, hashAdminKey } from './utils/security';
import {
  StorageService,
  createDemoEvent,
  EventDataPackage,
} from './services/storage';

import { Header } from './components/Header';
import { ParticipantBar } from './components/ParticipantBar';
import { CalendarGrid } from './components/CalendarGrid';
import { TripWindowFinder } from './components/TripWindowFinder';
import { CreateTripModal } from './components/CreateTripModal';
import { ShareModal } from './components/ShareModal';
import { AdminModal } from './components/AdminModal';
import { PinModal } from './components/PinModal';
import { DayDetailsModal } from './components/DayDetailsModal';

import { Palmtree, Sparkles, Plus, Calendar, Users, Compass, X, Unlock } from 'lucide-react';

export default function App() {
  const [eventData, setEventData] = useState<EventDataPackage | null>(null);
  const [recentTrips, setRecentTrips] = useState<EventDataPackage[]>([]);
  const [currentParticipant, setCurrentParticipant] = useState<Participant | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminKey, setAdminKey] = useState<string | null>(null);
  const [targetDuration, setTargetDuration] = useState<number>(7);
  const [selectedWindow, setSelectedWindow] = useState<TripWindow | null>(null);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isPinOpen, setIsPinOpen] = useState(false);
  const [pinTarget, setPinTarget] = useState<Participant | null>(null);
  const [selectedDaySummary, setSelectedDaySummary] = useState<DaySummary | null>(null);

  // Parse URL: check query params (?event=...) AND hash (#event=...)
  const parseUrlParams = useCallback(() => {
    // 1. Check search query params first (better for link previews & social shares)
    const searchParams = new URLSearchParams(window.location.search);
    let eventId = searchParams.get('event');
    let adminParam = searchParams.get('admin');

    // 2. Fallback to hash params
    if (!eventId) {
      const hash = window.location.hash.replace(/^#/, '');
      const hashParams = new URLSearchParams(hash);
      eventId = hashParams.get('event');
      adminParam = hashParams.get('admin') || adminParam;
    }

    return { eventId, adminParam };
  }, []);

  const loadEvent = useCallback(async (eventId: string, adminParam?: string | null) => {
    let data = StorageService.getEvent(eventId);
    if (!data && eventId === 'demo-summer-trip') {
      data = await createDemoEvent();
    }
    if (!data) {
      data = await StorageService.fetchCloudEvent(eventId);
    } else if (!eventId.startsWith('demo-')) {
      // Auto-sync locally cached event to Cloudflare KV for any polls created before edge sync was live
      StorageService.pushEventToCloud(data);
    }

    if (data) {
      setEventData(data);
      setTargetDuration(data.event.defaultDurationDays || 7);
      setSelectedWindow(null);

      // Check admin key
      const storedAdminKey = StorageService.getAdminKey(eventId);
      const activeAdminKey = adminParam || storedAdminKey;
      if (activeAdminKey) {
        const saltedHash = await hashAdminKey(data.event.id, activeAdminKey);
        const legacyHash = await hashString(activeAdminKey);
        if (saltedHash === data.event.adminKeyHash || legacyHash === data.event.adminKeyHash) {
          setIsAdmin(true);
          setAdminKey(activeAdminKey);
          StorageService.saveAdminKey(eventId, activeAdminKey);
        }
      }

      // Check active participant session
      const session = StorageService.getParticipantSession(eventId);
      if (session) {
        const matched = data.participants.find(p => p.id === session.participantId);
        if (matched) {
          setCurrentParticipant(matched);
        }
      }
    }
  }, []);

  // Initialize from URL or keep clean home
  useEffect(() => {
    setRecentTrips(StorageService.getRecentEventPackages());
    const { eventId, adminParam } = parseUrlParams();
    if (eventId) {
      loadEvent(eventId, adminParam);
    }

    // URL change listener
    const handleUrlChange = () => {
      const { eventId: newId, adminParam: newAdmin } = parseUrlParams();
      if (newId) {
        loadEvent(newId, newAdmin);
      } else {
        setEventData(null);
        setCurrentParticipant(null);
        setSelectedWindow(null);
        setIsAdmin(false);
        setAdminKey(null);
        setRecentTrips(StorageService.getRecentEventPackages());
      }
    };

    window.addEventListener('hashchange', handleUrlChange);
    window.addEventListener('popstate', handleUrlChange);
    return () => {
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, [loadEvent, parseUrlParams]);

  // Derived calculations
  const dates = useMemo(() => {
    if (!eventData) return [];
    return getDatesInRange(eventData.event.startDate, eventData.event.endDate);
  }, [eventData]);

  const daySummaries = useMemo(() => {
    if (!eventData || dates.length === 0) return {};
    return calculateDaySummaries(dates, eventData.participants, eventData.responses);
  }, [dates, eventData]);

  const tripWindows = useMemo(() => {
    if (!eventData) return [];
    return calculateTripWindows(
      eventData.event.startDate,
      eventData.event.endDate,
      targetDuration,
      eventData.participants,
      eventData.responses
    );
  }, [eventData, targetDuration]);

  const myResponse = useMemo(() => {
    if (!eventData || !currentParticipant) return null;
    return eventData.responses.find(r => r.participantId === currentParticipant.id) || null;
  }, [eventData, currentParticipant]);

  // Navigation & Actions
  const handleGoHome = () => {
    window.history.pushState(null, '', window.location.pathname);
    window.location.hash = '';
    setEventData(null);
    setCurrentParticipant(null);
    setSelectedWindow(null);
    setIsAdmin(false);
    setAdminKey(null);
    setRecentTrips(StorageService.getRecentEventPackages());
  };

  const handleOpenRecentTrip = (eventId: string) => {
    const adminKey = StorageService.getAdminKey(eventId);
    const targetUrl = adminKey ? `?event=${eventId}&admin=${adminKey}` : `?event=${eventId}`;
    window.history.pushState(null, '', targetUrl);
    loadEvent(eventId, adminKey);
  };

  const handleRemoveRecentTrip = (eventId: string) => {
    StorageService.removeRecentEvent(eventId);
    setRecentTrips(prev => prev.filter(pkg => pkg.event.id !== eventId));
  };

  const handleLoadDemo = async () => {
    const demo = await createDemoEvent();
    window.history.pushState(null, '', `?event=${demo.event.id}&admin=super-secret-demo-admin`);
    loadEvent(demo.event.id, 'super-secret-demo-admin');
  };

  const handleTripCreated = (eventId: string, key: string) => {
    window.history.pushState(null, '', `?event=${eventId}&admin=${key}`);
    loadEvent(eventId, key);
    setRecentTrips(StorageService.getRecentEventPackages());
  };

  const handleSaveAvailability = (
    newAvail: Record<string, { date: string; status: AvailabilityStatus; note?: string }>
  ) => {
    if (!eventData || !currentParticipant) return;

    const existingIndex = eventData.responses.findIndex(
      r => r.participantId === currentParticipant.id
    );

    const updatedResponses = [...eventData.responses];
    const newRecord: ParticipantResponse = {
      participantId: currentParticipant.id,
      eventId: eventData.event.id,
      availability: newAvail,
      updatedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      updatedResponses[existingIndex] = newRecord;
    } else {
      updatedResponses.push(newRecord);
    }

    const updatedPackage: EventDataPackage = {
      ...eventData,
      responses: updatedResponses,
    };

    setEventData(updatedPackage);
    const session = StorageService.getParticipantSession(eventData.event.id);
    StorageService.saveParticipantResponseDelta(
      eventData.event.id,
      currentParticipant,
      newRecord,
      session?.pin || ''
    );
  };

  const handleSelectParticipant = (p: Participant) => {
    // If it's the currently logged-in user, do nothing (already editing)
    if (currentParticipant?.id === p.id) return;
    // Prompt PIN to unlock or switch to them
    setPinTarget(p);
    setIsPinOpen(true);
  };

  const handleLogoutParticipant = () => {
    setCurrentParticipant(null);
  };

  const handleVerifyAdmin = async (keyInput: string) => {
    if (!eventData) return false;
    const saltedHash = await hashAdminKey(eventData.event.id, keyInput);
    const legacyHash = await hashString(keyInput);
    if (saltedHash === eventData.event.adminKeyHash || legacyHash === eventData.event.adminKeyHash) {
      setIsAdmin(true);
      setAdminKey(keyInput);
      StorageService.saveAdminKey(eventData.event.id, keyInput);
      return true;
    }
    return false;
  };

  const handleUpdateEvent = (updatedProps: Partial<TripEvent>) => {
    if (!eventData) return;
    const updated: EventDataPackage = {
      ...eventData,
      event: {
        ...eventData.event,
        ...updatedProps,
        updatedAt: new Date().toISOString(),
      },
    };
    setEventData(updated);
    StorageService.saveEvent(updated);
  };

  const handleDeleteParticipant = (participantId: string) => {
    if (!eventData) return;
    const updated: EventDataPackage = {
      ...eventData,
      participants: eventData.participants.filter(p => p.id !== participantId),
      responses: eventData.responses.filter(r => r.participantId !== participantId),
    };
    if (currentParticipant?.id === participantId) {
      setCurrentParticipant(null);
    }
    setEventData(updated);
    StorageService.saveEvent(updated);
  };

  const handleFinalizeWindow = (win: TripWindow) => {
    // Never overwrite event.startDate or event.endDate so calendar horizon is never destroyed!
    handleUpdateEvent({
      isLocked: true,
      lockedWindow: {
        startDate: win.startDate,
        endDate: win.endDate,
      },
    });
  };

  const handleUnlockEvent = () => {
    handleUpdateEvent({
      isLocked: false,
      lockedWindow: undefined,
    });
  };

  const handleDeletePoll = async () => {
    if (!eventData) return;
    const pollId = eventData.event.id;
    await StorageService.deleteEvent(pollId, adminKey);
    setIsAdminOpen(false);
    handleGoHome();
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900 pb-16">
      <Header
        event={eventData?.event || null}
        isAdmin={isAdmin}
        onOpenShare={() => setIsShareOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenNewTrip={() => setIsCreateOpen(true)}
        onLoadDemo={handleLoadDemo}
        onGoHome={handleGoHome}
      />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 pt-5 sm:pt-6">
        {!eventData ? (
          /* Landing Hero View */
          <div className="max-w-2xl mx-auto text-center py-12 sm:py-20 space-y-8 animate-in fade-in duration-300">
            <div className="inline-flex p-4 rounded-3xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
              <Palmtree className="w-12 h-12 stroke-[2]" />
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-zinc-950">
                Plan holidays together without the headache.
              </h1>
              <p className="text-base sm:text-lg text-zinc-600 max-w-lg mx-auto leading-relaxed">
                Create a trip poll, share the link with friends, paint your free vacation days, and instantly discover the best continuous dates for everyone.
              </p>
            </div>

            {/* Clear Primary & Secondary Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98] transition-all cursor-pointer shadow-md shadow-emerald-600/20"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Create a Vacation Poll</span>
              </button>

              <button
                type="button"
                onClick={handleLoadDemo}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-semibold bg-white text-zinc-800 border border-zinc-200/90 hover:bg-zinc-100/80 active:scale-[0.98] transition-all cursor-pointer shadow-xs"
              >
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Try Live Demo</span>
              </button>
            </div>

            {/* Recent Polls on this Device (if any real trips are stored) */}
            {recentTrips.length > 0 && (
              <div className="pt-2 text-left max-w-lg mx-auto w-full space-y-2.5">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                    Your Recent Polls on this Device
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    Saved in browser
                  </span>
                </div>
                <div className="space-y-2">
                  {recentTrips.map((pkg) => (
                    <div
                      key={pkg.event.id}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-zinc-200/90 hover:border-emerald-500/60 transition-all shadow-xs group"
                    >
                      <div
                        onClick={() => handleOpenRecentTrip(pkg.event.id)}
                        className="flex-1 min-w-0 cursor-pointer pr-3"
                      >
                        <h4 className="text-sm font-bold text-zinc-950 group-hover:text-emerald-700 transition-colors truncate">
                          {pkg.event.title}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
                          <span>{formatWindowRange(pkg.event.startDate, pkg.event.endDate)}</span>
                          <span>•</span>
                          <span>{pkg.participants.length} {pkg.participants.length === 1 ? 'friend' : 'friends'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenRecentTrip(pkg.event.id)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 hover:bg-emerald-600 hover:text-white transition-all cursor-pointer shadow-2xs"
                        >
                          Open Poll →
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveRecentTrip(pkg.event.id);
                          }}
                          className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Remove from recent polls on this device"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Feature Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-10 text-left border-t border-zinc-200/60">
              <div className="p-4 rounded-2xl bg-white border border-zinc-200/80 shadow-xs">
                <Users className="w-5 h-5 text-emerald-600 mb-2" />
                <h3 className="font-bold text-sm text-zinc-900">Zero Accounts</h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Friends join via link with a simple 4-digit PIN. No email or passwords required.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-zinc-200/80 shadow-xs">
                <Calendar className="w-5 h-5 text-indigo-600 mb-2" />
                <h3 className="font-bold text-sm text-zinc-900">Touch Calendar Painter</h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Tap or drag across days to quickly paint free vs busy dates on mobile or desktop.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-zinc-200/80 shadow-xs">
                <Compass className="w-5 h-5 text-amber-600 mb-2" />
                <h3 className="font-bold text-sm text-zinc-900">Smart Window Finder</h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Automatically ranks continuous 3-day, 7-day, or 14-day stretches by highest friend overlap.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Active Poll Dashboard */
          <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
            {/* Unified Header Card (Title, Active Session, and Participants) */}
            <ParticipantBar
              eventTitle={eventData.event.title}
              eventDescription={eventData.event.description}
              participants={eventData.participants}
              responses={eventData.responses}
              currentParticipant={currentParticipant}
              isLocked={eventData.event.isLocked}
              isAdmin={isAdmin}
              lockedWindow={eventData.event.lockedWindow}
              onUnlock={handleUnlockEvent}
              onAddParticipant={() => {
                setPinTarget(null);
                setIsPinOpen(true);
              }}
              onSelectParticipant={handleSelectParticipant}
              onLogoutParticipant={handleLogoutParticipant}
            />

            {/* FULL-WIDTH CALENDAR HEATMAP (Spacious 2-Month Grid on Top) */}
            <section id="calendar-section" className="scroll-mt-20">
              <CalendarGrid
                startDateStr={eventData.event.startDate}
                endDateStr={eventData.event.endDate}
                daySummaries={daySummaries}
                selectedWindow={
                  eventData.event.isLocked && eventData.event.lockedWindow
                    ? {
                        startDate: eventData.event.lockedWindow.startDate,
                        endDate: eventData.event.lockedWindow.endDate,
                        durationDays: targetDuration,
                        averageScore: 1,
                        minAvailable: eventData.participants.length,
                        fullAttendance: true,
                        attendancePercentage: 100,
                        daySummaries: [],
                        unavailableParticipants: [],
                      }
                    : selectedWindow
                }
                currentParticipant={currentParticipant}
                myResponse={myResponse}
                onSaveAvailability={handleSaveAvailability}
                onSelectDayDetails={setSelectedDaySummary}
              />
            </section>

            {/* SMART TRIP WINDOW FINDER OR FINALIZED TRIP CELEBRATION */}
            <section id="windows-section" className="scroll-mt-20">
              {eventData.event.isLocked ? (
                <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-amber-50 rounded-2xl border border-emerald-200/90 p-6 text-center space-y-3 shadow-xs">
                  <div className="inline-flex p-3 rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
                    <Sparkles className="w-7 h-7 stroke-[2.2]" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-extrabold text-zinc-950">
                      Trip Dates Finalized! 🎉
                    </h3>
                    <p className="text-base font-bold text-emerald-900">
                      {eventData.event.lockedWindow
                        ? formatWindowRange(eventData.event.lockedWindow.startDate, eventData.event.lockedWindow.endDate)
                        : `${eventData.event.startDate} – ${eventData.event.endDate}`}
                    </p>
                    <p className="text-xs text-zinc-600 max-w-md mx-auto">
                      The organizer has locked this trip poll. Availability voting and edits are now closed.
                    </p>
                  </div>
                  {isAdmin && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleUnlockEvent}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white text-zinc-800 border border-zinc-300 hover:bg-zinc-100 shadow-xs cursor-pointer transition-colors"
                      >
                        <Unlock className="w-3.5 h-3.5 text-zinc-600" />
                        <span>Unlock Poll to Change Dates</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <TripWindowFinder
                  windows={tripWindows}
                  selectedWindow={selectedWindow}
                  onSelectWindow={setSelectedWindow}
                  targetDuration={targetDuration}
                  onChangeDuration={setTargetDuration}
                  participants={eventData.participants}
                  isAdmin={isAdmin}
                  onFinalizeDate={handleFinalizeWindow}
                />
              )}
            </section>
          </div>
        )}
      </main>

      {/* Modals */}
      <CreateTripModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onTripCreated={handleTripCreated}
      />

      {eventData && (
        <>
          <ShareModal
            isOpen={isShareOpen}
            onClose={() => setIsShareOpen(false)}
            event={eventData.event}
          />

          <AdminModal
            isOpen={isAdminOpen}
            onClose={() => setIsAdminOpen(false)}
            event={eventData.event}
            participants={eventData.participants}
            isAdmin={isAdmin}
            adminKey={adminKey}
            onVerifyAdmin={handleVerifyAdmin}
            onUpdateEvent={handleUpdateEvent}
            onDeleteParticipant={handleDeleteParticipant}
            onDeletePoll={handleDeletePoll}
          />

          <PinModal
            isOpen={isPinOpen}
            onClose={() => setIsPinOpen(false)}
            eventId={eventData.event.id}
            participants={eventData.participants}
            targetParticipant={pinTarget}
            onSelectParticipant={(p) => setCurrentParticipant(p)}
          />

          <DayDetailsModal
            isOpen={!!selectedDaySummary}
            onClose={() => setSelectedDaySummary(null)}
            daySummary={selectedDaySummary}
          />
        </>
      )}
    </div>
  );
}
