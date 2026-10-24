import React, { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import { AvailabilityStatus } from '../types';
import { formatDateSafe } from '../utils/dateCalc';
import { useTranslation } from '../i18n/LanguageContext';
import { MessageSquare, Check } from 'lucide-react';

interface DayNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateStr: string | null;
  currentStatus: AvailabilityStatus;
  currentNote: string;
  onSave: (dateStr: string, status: AvailabilityStatus, note: string) => void;
}

export const DayNoteModal: React.FC<DayNoteModalProps> = ({
  isOpen,
  onClose,
  dateStr,
  currentStatus,
  currentNote,
  onSave,
}) => {
  const { t, dateLocale } = useTranslation();
  const [status, setStatus] = useState<AvailabilityStatus>(currentStatus);
  const [note, setNote] = useState(currentNote);

  useEffect(() => {
    setStatus(currentStatus);
    setNote(currentNote || '');
  }, [currentStatus, currentNote, isOpen]);

  if (!dateStr) return null;

  const dateFormatted = formatDateSafe(dateStr, 'EEEE d MMMM yyyy', dateLocale);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(dateStr, status, note.trim());
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={dateFormatted}
      maxWidthClass="max-w-sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1.5">
            {t.yourStatusForDay}
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setStatus('available')}
              className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                status === 'available'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              {t.statusAvailable}
            </button>
            <button
              type="button"
              onClick={() => setStatus('maybe')}
              className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                status === 'maybe'
                  ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              }`}
            >
              {t.statusMaybe}
            </button>
            <button
              type="button"
              onClick={() => setStatus('busy')}
              className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                status === 'busy'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                  : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
              }`}
            >
              {t.statusBusy}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1.5 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-zinc-400" />
            <span>{t.addNoteOptional}</span>
          </label>
          <input
            type="text"
            value={note}
            autoFocus
            onChange={(e) => setNote(e.target.value)}
            placeholder={t.notePlaceholder}
            maxLength={100}
            className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            {t.cancelBtn}
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 transition-colors cursor-pointer shadow-xs"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{t.saveNoteBtn}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
