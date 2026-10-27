import React, { useState } from 'react';
import { format } from 'date-fns';
import { Modal } from './ui/Modal';
import { TripEvent, Participant, ParticipantResponse, DayAvailability } from '../types';
import { hashAdminKey, hashParticipantPin, generateRandomId } from '../utils/security';
import { getParticipantColor } from '../utils/colors';
import { getDatesInRange } from '../utils/dateCalc';
import { StorageService } from '../services/storage';
import { useTranslation } from '../i18n/LanguageContext';
import { Calendar, Users, Clock, Sparkles } from 'lucide-react';

interface CreateTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTripCreated: (eventId: string, adminKey: string) => void;
}

export const CreateTripModal: React.FC<CreateTripModalProps> = ({
  isOpen,
  onClose,
  onTripCreated,
}) => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();
  const defaultStart = `${currentYear}-07-01`;
  const defaultEnd = `${currentYear}-08-31`;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [activePreset, setActivePreset] = useState<'summer' | 'nextMonth' | 'autumn' | null>('summer');
  const [durationDays, setDurationDays] = useState(7);
  const [isCustomDuration, setIsCustomDuration] = useState(false);
  const [creatorName, setCreatorName] = useState('');
  const [creatorPin, setCreatorPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleQuickDates = (preset: 'summer' | 'nextMonth' | 'autumn') => {
    setActivePreset(preset);
    const now = new Date();
    if (preset === 'summer') {
      setStartDate(`${currentYear}-07-01`);
      setEndDate(`${currentYear}-08-31`);
    } else if (preset === 'nextMonth') {
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const endOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0);
      setStartDate(nextMonth.toISOString().split('T')[0]);
      setEndDate(endOfNextMonth.toISOString().split('T')[0]);
    } else if (preset === 'autumn') {
      setStartDate(`${currentYear}-09-01`);
      setEndDate(`${currentYear}-10-31`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError(t.errorTitleRequired);
      return;
    }
    if (!startDate || !endDate) {
      setError(t.errorDatesRequired);
      return;
    }
    if (startDate >= endDate) {
      setError(t.errorDateOrder);
      return;
    }
    if (durationDays < 1) {
      setError(t.errorDurationMin);
      return;
    }
    if (!creatorName.trim()) {
      setError(t.errorNameRequired);
      return;
    }
    const cleanPin = creatorPin.trim();
    if (cleanPin.length !== 4 || !/^\d{4}$/.test(cleanPin)) {
      setError(t.errorPinDigits);
      return;
    }

    setIsSubmitting(true);
    try {
      const eventId = `trip-${generateRandomId(8)}`;
      // Unified admin authentication: organizer's 4-digit PIN IS the admin key
      const adminKey = cleanPin;
      const adminKeyHash = await hashAdminKey(eventId, adminKey);

      const event: TripEvent = {
        id: eventId,
        title: title.trim(),
        description: description.trim() || undefined,
        startDate,
        endDate,
        defaultDurationDays: durationDays,
        adminKeyHash,
        isLocked: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const participants: Participant[] = [];
      const participantId = `p-${generateRandomId(6)}`;
      const pinHash = await hashParticipantPin(eventId, participantId, cleanPin);
      const color = getParticipantColor(creatorName.trim(), 0).bg;
      const creatorParticipant: Participant = {
        id: participantId,
        eventId,
        name: creatorName.trim(),
        pinHash,
        color,
        createdAt: new Date().toISOString(),
      };
      participants.push(creatorParticipant);
      StorageService.saveParticipantSession(eventId, participantId, cleanPin);

      // Pre-fill creator availability with all slots available by default
      const allDates = getDatesInRange(startDate, endDate);
      const initialAvailability: Record<string, DayAvailability> = {};
      for (const d of allDates) {
        const dStr = format(d, 'yyyy-MM-dd');
        initialAvailability[dStr] = { date: dStr, status: 'available' };
      }
      const creatorResponse: ParticipantResponse = {
        participantId,
        eventId,
        availability: initialAvailability,
        updatedAt: new Date().toISOString(),
      };

      StorageService.saveEvent({
        event,
        participants,
        responses: [creatorResponse],
      });
      StorageService.saveAdminKey(eventId, adminKey);

      onTripCreated(eventId, adminKey);
      onClose();
    } catch (err) {
      console.error(err);
      setError(t.errorGeneric);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t.createModalTitle} maxWidthClass="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
            {error}
          </div>
        )}

        {/* Trip Title */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1.5">
            {t.tripTitleLabel}
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t.tripTitlePlaceholder}
            className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-white text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all text-xs font-medium"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1.5">
            {t.descriptionLabel}
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t.descriptionPlaceholder}
            className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-white text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all text-xs"
          />
        </div>

        {/* Prominent Date Presets */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-600 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-zinc-500" />
            <span>{t.calendarWindowLabel}</span>
          </label>

          {/* Prominent Quick-Select Chips with Active State Highlight */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleQuickDates('summer')}
              className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                activePreset === 'summer'
                  ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                  : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
              }`}
            >
              {t.presetSummer}
            </button>
            <button
              type="button"
              onClick={() => handleQuickDates('nextMonth')}
              className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                activePreset === 'nextMonth'
                  ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                  : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
              }`}
            >
              {t.presetNextMonth}
            </button>
            <button
              type="button"
              onClick={() => handleQuickDates('autumn')}
              className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                activePreset === 'autumn'
                  ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                  : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
              }`}
            >
              {t.presetAutumn}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="w-full min-w-0 max-w-full box-border">
              <span className="text-[10px] text-zinc-500 mb-0.5 block">{t.earliestStartLabel}</span>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setActivePreset(null);
                }}
                className="w-full min-w-0 max-w-full box-border px-2.5 py-1.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>
            <div className="w-full min-w-0 max-w-full box-border">
              <span className="text-[10px] text-zinc-500 mb-0.5 block">{t.latestReturnLabel}</span>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setActivePreset(null);
                }}
                className="w-full min-w-0 max-w-full box-border px-2.5 py-1.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>
          </div>
        </div>

        {/* Target Trip Duration: Weekend (3d), 1 Week (7d), 2 Weeks (14d), Custom */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-600 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
            <span>{t.targetDurationLabel}</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => {
                setIsCustomDuration(false);
                setDurationDays(3);
              }}
              className={`py-2 sm:py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                !isCustomDuration && durationDays === 3
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
              }`}
            >
              {t.durationWeekend}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsCustomDuration(false);
                setDurationDays(7);
              }}
              className={`py-2 sm:py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                !isCustomDuration && durationDays === 7
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
              }`}
            >
              {t.duration1Week}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsCustomDuration(false);
                setDurationDays(14);
              }}
              className={`py-2 sm:py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                !isCustomDuration && durationDays === 14
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
              }`}
            >
              {t.duration2Weeks}
            </button>
            <button
              type="button"
              onClick={() => setIsCustomDuration(true)}
              className={`py-2 sm:py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isCustomDuration
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
              }`}
            >
              {t.durationCustom}
            </button>
          </div>
          {isCustomDuration && (
            <div className="mt-2 flex items-center gap-2 p-2 rounded-lg bg-zinc-50 border border-zinc-200">
              <span className="text-xs text-zinc-600 font-medium">{t.customLengthLabel}</span>
              <input
                type="number"
                min={1}
                max={60}
                value={durationDays}
                onChange={(e) => setDurationDays(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-16 px-2 py-1 rounded-md border border-zinc-300 text-xs font-bold text-center bg-white"
              />
              <span className="text-xs text-zinc-500">{t.daysUnit}</span>
            </div>
          )}
        </div>

        {/* Creator Info */}
        <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700">
            <Users className="w-3.5 h-3.5 text-zinc-500" />
            <span>{t.yourInfoLabel}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <input
                type="text"
                required
                value={creatorName}
                onChange={(e) => setCreatorName(e.target.value)}
                placeholder={t.yourNamePlaceholder}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-white text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>
            <div>
              <input
                type="password"
                required
                maxLength={4}
                inputMode="numeric"
                pattern="[0-9]*"
                value={creatorPin}
                onChange={(e) => setCreatorPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder={t.pinPlaceholder}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-white text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            {t.cancelBtn}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer shadow-sm shadow-emerald-600/20"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isSubmitting ? t.creatingBtn : t.createTripSubmitBtn}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
