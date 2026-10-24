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
} from './utils/dateCalc';
import { hashString } from './utils/security';
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
import { DayNoteModal } from './components/DayNoteModal';

import { Palmtree, Sparkles, Plus, Calendar, Users, Compass } from 'lucide-react';

export default function App() {
  const [eventData, setEventData] = useState<EventDataPackage | null>(null);
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

  // Parse URL hash for #event=<id>&admin=<key>
  const parseUrlParams = useCallback(() => {
    const hash = window.location.hash.replace(/^#/, '');
    const params = new URLSearchParams(hash);
    const eventId = params.get('event');
    const adminParam = params.get('admin');
    return { eventId, adminParam };
  }, []);

  const loadEvent = useCallback(async (eventId: string, adminParam?: string | null) => {
    let data = StorageService.getEvent(eventId);
    if (!data && eventId === 'demo-summer-trip') {
      data = await createDemoEvent();
    }
    if (!data) {
      data = await StorageService.fetchCloudEvent(eventId);
    }

    if (data) {
      setEventData(data);
      setTargetDuration(data.event.defaultDurationDays || 7);
      setSelectedWindow(null);

      // Check admin key
      const storedAdminKey = StorageService.getAdminKey(eventId);
      const activeAdminKey = adminParam || storedAdminKey;
      if (activeAdminKey) {
        const hash = await hashString(activeAdminKey);
        if (hash === data.event.adminKeyHash) {
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

  // Initialize from hash or fallback
  useEffect(() => {
    const { eventId, adminParam } = parseUrlParams();
    if (eventId) {
      loadEvent(eventId, adminParam);
    } else {
      // Check if recent events exist
      const recent = StorageService.getRecentEvents();
      if (recent.length > 0) {
        window.location.hash = `#event=${recent[0]}`;
        loadEvent(recent[0]);
      }
    }

    // Hash change listener
    const handleHashChange = () => {
      const { eventId: newId, adminParam: newAdmin } = parseUrlParams();
      if (newId) {
        loadEvent(newId, newAdmin);
      } else {
        setEventData(null);
        setCurrentParticipant(null);
        setSelectedWindow(null);
        setIsAdmin(false);
        setAdminKey(null);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
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

  // Handlers
  const handleGoHome = () => {
    window.location.hash = '';
    setEventData(null);
    setCurrentParticipant(null);
    setSelectedWindow(null);
    setIsAdmin(false);
    setAdminKey(null);
  };

  const handleLoadDemo = async () => {
    const demo = await createDemoEvent();
    window.location.hash = `#event=${demo.event.id}&admin=super-secret-demo-admin`;
    loadEvent(demo.event.id, 'super-secret-demo-admin');
  };

  const handleTripCreated = (eventId: string, key: string) => {
    window.location.hash = `#event=${eventId}&admin=${key}`;
    loadEvent(eventId, key);
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
    StorageService.saveEvent(updatedPackage);
  };

  const handleSelectParticipant = (p: Participant) => {
    setCurrentParticipant(p);
  };

  const handleLogoutParticipant = () => {
    setCurrentParticipant(null);
  };

  const handleVerifyAdmin = async (keyInput: string) => {
    if (!eventData) return false;
    const hash = await hashString(keyInput);
    if (hash === eventData.event.adminKeyHash) {
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

  const handleOpenDayNote = (
    dateStr: string,
    currentStatus: AvailabilityStatus,
    currentNote: string
  ) => {
    setNoteModal({
      isOpen: true,
      dateStr,
      status: currentStatus,
      note: currentNote,
    });
  };

  const handleSaveDayNote = (dateStr: string, status: AvailabilityStatus, note: string) => {
    if (!myResponse && !currentParticipant) return;
    const curMap = myResponse?.availability || {};
    const updated = {
      ...curMap,
      [dateStr]: {
        date: dateStr,
        status,
        note,
      },
    };
    handleSaveAvailability(updated);
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

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        {!eventData ? (
          /* Empty / Landing Hero State */
          <div className="max-w-2xl mx-auto text-center py-12 sm:py-20 space-y-8 animate-in fade-in duration-300">
            <div className="inline-flex p-4 rounded-3xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
              <Palmtree className="w-12 h-12 stroke-[2]" />
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-zinc-950">
                Plan holidays together without the headache.
              </h1>
              <p className="text-base sm:text-lg text-zinc-600 max-w-lg mx-auto leading-relaxed">
                Create a trip poll, share the link, paint your free vacation days, and instantly discover the best dates for everyone.
              </p>
            </div>

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
                <span>Explore Live Demo</span>
              </button>
            </div>

            {/* Feature Highlights (Clean & Direct) */}
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
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Poll Description Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-2">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950">
                  {eventData.event.title}
                </h1>
                {eventData.event.description && (
                  <p className="text-sm text-zinc-600 mt-0.5">
                    {eventData.event.description}
                  </p>
                )}
              </div>
            </div>

            {/* Participant Bar & Access Controls */}
            <ParticipantBar
              participants={eventData.participants}
              responses={eventData.responses}
              currentParticipant={currentParticipant}
              isLocked={eventData.event.isLocked}
              onAddParticipant={() => {
                setPinTarget(null);
                setIsPinOpen(true);
              }}
              onSelectParticipant={(p) => {
                setPinTarget(p);
                setIsPinOpen(true);
              }}
              onLogoutParticipant={handleLogoutParticipant}
            />

            {/* Smart Window Finder */}
            <TripWindowFinder
              windows={tripWindows}
              selectedWindow={selectedWindow}
              onSelectWindow={setSelectedWindow}
              targetDuration={targetDuration}
              onChangeDuration={setTargetDuration}
              participants={eventData.participants}
            />

            {/* Interactive Calendar (Heatmap / Paint Mode) */}
            <CalendarGrid
              startDateStr={eventData.event.startDate}
              endDateStr={eventData.event.endDate}
              daySummaries={daySummaries}
              selectedWindow={selectedWindow}
              currentParticipant={currentParticipant}
              myResponse={myResponse}
              onSaveAvailability={handleSaveAvailability}
              onSelectDayDetails={setSelectedDaySummary}
              onOpenDayNote={handleOpenDayNote}
            />
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
            adminKey={adminKey}
          />

          <AdminModal
            isOpen={isAdminOpen}
            onClose={() => setIsAdminOpen(false)}
            event={eventData.event}
            participants={eventData.participants}
            isAdmin={isAdmin}
            onVerifyAdmin={handleVerifyAdmin}
            onUpdateEvent={handleUpdateEvent}
            onDeleteParticipant={handleDeleteParticipant}
          />

          <PinModal
            isOpen={isPinOpen}
            onClose={() => setIsPinOpen(false)}
            eventId={eventData.event.id}
            participants={eventData.participants}
            targetParticipant={pinTarget}
            onSelectParticipant={handleSelectParticipant}
          />

          <DayDetailsModal
            isOpen={!!selectedDaySummary}
            onClose={() => setSelectedDaySummary(null)}
            daySummary={selectedDaySummary}
          />

          <DayNoteModal
            isOpen={noteModal.isOpen}
            onClose={() => setNoteModal(prev => ({ ...prev, isOpen: false }))}
            dateStr={noteModal.dateStr}
            currentStatus={noteModal.status}
            currentNote={noteModal.note}
            onSave={handleSaveDayNote}
          />
        </>
      )}
    </div>
  );
}
