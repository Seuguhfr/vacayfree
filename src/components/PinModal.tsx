import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { Participant } from '../types';
import { hashParticipantPin, generateRandomId } from '../utils/security';
import { getParticipantColor } from '../utils/colors';
import { StorageService } from '../services/storage';
import { useTranslation } from '../i18n/LanguageContext';
import { KeyRound, UserPlus, Lock } from 'lucide-react';

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  participants: Participant[];
  onSelectParticipant: (participant: Participant) => void;
  targetParticipant?: Participant | null;
}

export const PinModal: React.FC<PinModalProps> = ({
  isOpen,
  onClose,
  eventId,
  participants,
  onSelectParticipant,
  targetParticipant = null,
}) => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'create' | 'login'>(targetParticipant ? 'login' : 'create');
  const [selectedId, setSelectedId] = useState<string>(targetParticipant?.id || participants[0]?.id || '');
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (targetParticipant) {
      setMode('login');
      setSelectedId(targetParticipant.id);
    }
  }, [targetParticipant]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPin = pin.trim();
    if (cleanPin.length !== 4 || !/^\d{4}$/.test(cleanPin)) {
      setError(t.errorPinDigits);
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'create') {
        if (!name.trim()) {
          setError(t.errorNameRequired);
          setIsSubmitting(false);
          return;
        }

        // Smart name collision detection:
        const existing = participants.find(
          p => p.name.trim().toLowerCase() === name.trim().toLowerCase()
        );
        if (existing) {
          // Switch to login tab seamlessly for them!
          setSelectedId(existing.id);
          setMode('login');
          setError(t.errorNameCollision(existing.name));
          setIsSubmitting(false);
          return;
        }

        const participantId = `p-${generateRandomId(6)}`;
        const pinHash = await hashParticipantPin(eventId, participantId, pin.trim());

        const newParticipant: Participant = {
          id: participantId,
          eventId,
          name: name.trim(),
          pinHash,
          color: getParticipantColor(name.trim(), participants.length).bg,
          createdAt: new Date().toISOString(),
        };

        StorageService.saveParticipantSession(eventId, newParticipant.id, pin.trim());
        onSelectParticipant(newParticipant);
        onClose();
      } else {
        // Login mode
        const p = participants.find(part => part.id === selectedId);
        if (!p) {
          setError(t.errorParticipantNotFound);
          setIsSubmitting(false);
          return;
        }

        const isValid = await StorageService.verifyParticipantPin(
          eventId,
          p.id,
          pin.trim(),
          p.pinHash
        );

        if (!isValid) {
          setError(t.errorIncorrectPin);
          setIsSubmitting(false);
          return;
        }

        // Valid PIN!
        StorageService.saveParticipantSession(eventId, p.id, pin.trim());
        onSelectParticipant(p);
        onClose();
      }
    } catch (err) {
      console.error(err);
      setError(t.errorGeneric);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? t.pinModalTitleNew : t.pinModalTitleUnlock}
      maxWidthClass="max-w-sm"
    >
      {/* Switch between New and Returning */}
      {participants.length > 0 && !targetParticipant && (
        <div className="flex rounded-xl bg-zinc-100 p-1 mb-4">
          <button
            type="button"
            onClick={() => { setMode('create'); setError(null); }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              mode === 'create'
                ? 'bg-white text-zinc-900 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            {t.tabNewFriend}
          </button>
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null); }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-white text-zinc-900 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            {t.tabReturningFriend}
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {error && (
          <div className="p-2.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
            {error}
          </div>
        )}

        {mode === 'create' ? (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1">
              {t.nameLabel}
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.namePlaceholder}
              className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
          </div>
        ) : (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1">
              {t.tabReturningFriend}
            </label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
            >
              {participants.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Clean, consistent left-aligned PIN input */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1 flex items-center justify-between">
            <span>{mode === 'create' ? t.choose4DigitPinLabel : t.enterYourPinLabel}</span>
            <Lock className="w-3.5 h-3.5 text-zinc-400" />
          </label>
          <input
            type="password"
            required
            maxLength={4}
            inputMode="numeric"
            pattern="[0-9]*"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder={t.pinPlaceholder}
            className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs text-left focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer shadow-xs"
          >
            {mode === 'create' ? (
              <>
                <UserPlus className="w-4 h-4" />
                <span>{t.continueBtn}</span>
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>{t.continueBtn}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
