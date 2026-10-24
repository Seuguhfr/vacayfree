import React, { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import { AvailabilityStatus } from '../types';
import { formatDateSafe } from '../utils/dateCalc';
import { useTranslation } from '../i18n/LanguageContext';
import { MessageSquare, Check, Trash2 } from 'lucide-react';

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
  const [note, setNote] = useState(currentNote);

  useEffect(() => {
    setNote(currentNote || '');
  }, [currentNote, isOpen]);

  if (!dateStr) return null;

  const dateFormatted = formatDateSafe(dateStr, 'EEEE d MMMM yyyy', dateLocale);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onSave(dateStr, currentStatus, note.trim());
    onClose();
  };

  const handleDelete = () => {
    onSave(dateStr, currentStatus, '');
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
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-2 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-zinc-500" />
            <span>{t.addNoteOptional}</span>
          </label>
          <textarea
            value={note}
            autoFocus
            rows={3}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder={t.notePlaceholder}
            maxLength={140}
            className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 resize-none leading-relaxed"
          />
          <div className="flex justify-end mt-1">
            <span className="text-[10px] text-zinc-400 font-mono">
              {note.length}/140
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          {currentNote ? (
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t.deleteNoteBtn}</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
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
        </div>
      </form>
    </Modal>
  );
};
