import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { TripEvent, Participant } from '../types';
import { generateAdminKey, hashAdminKey, hashParticipantPin, generateRandomId } from '../utils/security';
import { getParticipantColor } from '../utils/colors';
import { StorageService } from '../services/storage';
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
  const currentYear = new Date().getFullYear();
  const defaultStart = `${currentYear}-07-01`;
  const defaultEnd = `${currentYear}-08-31`;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [durationDays, setDurationDays] = useState(7);
  const [isCustomDuration, setIsCustomDuration] = useState(false);
  const [creatorName, setCreatorName] = useState('');
  const [creatorPin, setCreatorPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleQuickDates = (preset: 'summer' | 'nextMonth' | 'autumn') => {
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
      setError('Please provide a trip title.');
      return;
    }
    if (!startDate || !endDate) {
      setError('Please select start and end dates.');
      return;
    }
    if (startDate >= endDate) {
      setError('End date must be after start date.');
      return;
    }
    if (durationDays < 1) {
      setError('Duration must be at least 1 day.');
      return;
    }

    setIsSubmitting(true);
    try {
      const eventId = `trip-${generateRandomId(8)}`;
      const adminKey = generateAdminKey();
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
      if (creatorName.trim()) {
        const pin = creatorPin.trim() || '1234';
        const participantId = `p-${generateRandomId(6)}`;
        const pinHash = await hashParticipantPin(eventId, participantId, pin);
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
        StorageService.saveParticipantSession(eventId, participantId, pin);
      }

      StorageService.saveEvent({
        event,
        participants,
        responses: [],
      });
      StorageService.saveAdminKey(eventId, adminKey);

      onTripCreated(eventId, adminKey);
      onClose();
    } catch (err) {
      console.error(err);
      setError('Failed to create trip. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create a Vacation Poll" maxWidthClass="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
            {error}
          </div>
        )}

        {/* Trip Title */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1">
            Trip Title *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Summer Trip in Portugal 🏖️"
            className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-white text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all text-xs font-medium"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1">
            Description or Destination Ideas (Optional)
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., Beach villa or mountain retreat, flexible on location"
            className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-white text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all text-xs"
          />
        </div>

        {/* Prominent Date Presets */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-600 flex items-center gap-1.5 mb-1.5">
            <Calendar className="w-3.5 h-3.5 text-zinc-500" />
            <span>Calendar Window *</span>
          </label>

          {/* Prominent Quick-Select Chips right under heading */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-semibold text-zinc-500">Quick presets:</span>
            <button
              type="button"
              onClick={() => handleQuickDates('summer')}
              className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 transition-colors cursor-pointer border border-zinc-200"
            >
              ☀️ Summer (Jul & Aug)
            </button>
            <button
              type="button"
              onClick={() => handleQuickDates('nextMonth')}
              className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 transition-colors cursor-pointer border border-zinc-200"
            >
              Next Month
            </button>
            <button
              type="button"
              onClick={() => handleQuickDates('autumn')}
              className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 transition-colors cursor-pointer border border-zinc-200"
            >
              Autumn
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[10px] text-zinc-500 mb-0.5 block">Earliest start</span>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 mb-0.5 block">Latest return</span>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>
          </div>
        </div>

        {/* Target Trip Duration: Weekend (3d), 1 Week (7d), 2 Weeks (14d), Custom */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-600 flex items-center gap-1.5 mb-1.5">
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
            Target Trip Duration
          </label>
          <div className="grid grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => {
                setIsCustomDuration(false);
                setDurationDays(3);
              }}
              className={`py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                !isCustomDuration && durationDays === 3
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
              }`}
            >
              Weekend (3d)
            </button>
            <button
              type="button"
              onClick={() => {
                setIsCustomDuration(false);
                setDurationDays(7);
              }}
              className={`py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                !isCustomDuration && durationDays === 7
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
              }`}
            >
              1 Week (7d)
            </button>
            <button
              type="button"
              onClick={() => {
                setIsCustomDuration(false);
                setDurationDays(14);
              }}
              className={`py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                !isCustomDuration && durationDays === 14
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
              }`}
            >
              2 Weeks (14d)
            </button>
            <button
              type="button"
              onClick={() => setIsCustomDuration(true)}
              className={`py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isCustomDuration
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
              }`}
            >
              Custom
            </button>
          </div>
          {isCustomDuration && (
            <div className="mt-2 flex items-center gap-2 p-2 rounded-lg bg-zinc-50 border border-zinc-200">
              <span className="text-xs text-zinc-600 font-medium">Custom duration:</span>
              <input
                type="number"
                min={1}
                max={60}
                value={durationDays}
                onChange={(e) => setDurationDays(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-16 px-2 py-1 rounded-md border border-zinc-300 text-xs font-bold text-center bg-white"
              />
              <span className="text-xs text-zinc-500">days</span>
            </div>
          )}
        </div>

        {/* Creator Info */}
        <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700">
            <Users className="w-3.5 h-3.5 text-zinc-500" />
            <span>Your Info (Organizer)</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <input
                type="text"
                value={creatorName}
                onChange={(e) => setCreatorName(e.target.value)}
                placeholder="Your Name (e.g. Alex)"
                className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>
            <div>
              <input
                type="password"
                maxLength={6}
                value={creatorPin}
                onChange={(e) => setCreatorPin(e.target.value)}
                placeholder="4-digit PIN (to edit later)"
                className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>
          </div>
          <p className="text-[10px] text-zinc-500">
            You will receive a secret admin link inside Organizer Controls to manage responses.
          </p>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer shadow-sm shadow-emerald-600/20"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isSubmitting ? 'Creating...' : 'Create Trip Poll'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
