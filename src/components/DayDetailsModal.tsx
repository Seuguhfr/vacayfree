import React from 'react';
import { Modal } from './ui/Modal';
import { DaySummary } from '../types';
import { formatDateSafe } from '../utils/dateCalc';
import { useTranslation } from '../i18n/LanguageContext';
import { CheckCircle2, HelpCircle, XCircle, MessageSquare } from 'lucide-react';

interface DayDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  daySummary: DaySummary | null;
}

export const DayDetailsModal: React.FC<DayDetailsModalProps> = ({
  isOpen,
  onClose,
  daySummary,
}) => {
  const { t, dateLocale } = useTranslation();
  if (!daySummary) return null;

  const dateFormatted = formatDateSafe(daySummary.date, 'EEEE d MMMM yyyy', dateLocale);

  const availableList = daySummary.participants.filter(p => p.status === 'available');
  const maybeList = daySummary.participants.filter(p => p.status === 'maybe');
  const busyList = daySummary.participants.filter(p => p.status === 'busy');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={dateFormatted}
      maxWidthClass="max-w-md"
    >
      <div className="space-y-4">
        {/* Score banner */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/80">
          <div>
            <span className="text-base font-bold text-zinc-900">
              {t.friendsFreeText(daySummary.availableCount, daySummary.totalParticipants)}
            </span>
            {daySummary.maybeCount > 0 && (
              <span className="text-xs text-amber-800 ml-1.5 font-medium">
                {t.maybeCountText(daySummary.maybeCount)}
              </span>
            )}
          </div>
          <div className="text-right">
            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${
              daySummary.percentage >= 80
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : daySummary.percentage >= 50
                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                : 'bg-zinc-200 text-zinc-700'
            }`}>
              {t.matchScoreText(daySummary.percentage)}
            </span>
          </div>
        </div>

        {/* Available Friends */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-800 mb-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t.availableSectionTitle(availableList.length)}</span>
          </div>
          {availableList.length === 0 ? (
            <p className="text-xs text-zinc-400 italic pl-5">{t.nobodyAvailableYet}</p>
          ) : (
            <div className="space-y-1.5 pl-1">
              {availableList.map(p => (
                <div key={p.participantId} className="flex flex-col gap-1 p-2 rounded-xl bg-emerald-50/50 border border-emerald-100/80">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${p.color}`} />
                      <span className="text-xs font-bold text-zinc-900">{p.participantName}</span>
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/60 px-1.5 py-0.2 rounded">
                      {t.statusAvailable}
                    </span>
                  </div>
                  {p.note && (
                    <div className="text-[11px] text-emerald-900 flex items-center gap-1 pl-4.5 bg-emerald-100/40 p-1 rounded-md">
                      <MessageSquare className="w-3 h-3 shrink-0 text-emerald-700" />
                      <span>{p.note}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Maybe / If needed Friends */}
        {maybeList.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-800 mb-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>{t.maybeSectionTitle(maybeList.length)}</span>
            </div>
            <div className="space-y-1.5 pl-1">
              {maybeList.map(p => (
                <div key={p.participantId} className="flex flex-col gap-1 p-2 rounded-xl bg-amber-50/50 border border-amber-200/60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${p.color}`} />
                      <span className="text-xs font-bold text-zinc-900">{p.participantName}</span>
                    </div>
                    <span className="text-[10px] font-semibold text-amber-800 bg-amber-100/60 px-1.5 py-0.2 rounded">
                      {t.statusMaybe}
                    </span>
                  </div>
                  {p.note && (
                    <div className="text-[11px] text-amber-950 flex items-center gap-1 pl-4.5 bg-amber-100/50 p-1 rounded-md">
                      <MessageSquare className="w-3 h-3 shrink-0 text-amber-700" />
                      <span>{p.note}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Busy / Unavailable Friends */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-rose-800 mb-1.5">
            <XCircle className="w-3.5 h-3.5 text-rose-500" />
            <span>{t.unavailableSectionTitle(busyList.length)}</span>
          </div>
          {busyList.length === 0 ? (
            <p className="text-xs text-emerald-700 italic pl-5">Nobody is busy on this date!</p>
          ) : (
            <div className="space-y-1.5 pl-1">
              {busyList.map(p => (
                <div key={p.participantId} className="flex flex-col gap-1 p-2 rounded-xl bg-zinc-50 border border-zinc-200/70">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${p.color}`} />
                      <span className="text-xs font-medium text-zinc-700">{p.participantName}</span>
                    </div>
                    <span className="text-[10px] font-medium text-zinc-500 bg-zinc-200/60 px-1.5 py-0.2 rounded">
                      {t.statusBusy}
                    </span>
                  </div>
                  {p.note && (
                    <div className="text-[11px] text-zinc-600 flex items-center gap-1 pl-4.5 bg-zinc-100 p-1 rounded-md">
                      <MessageSquare className="w-3 h-3 shrink-0 text-zinc-500" />
                      <span>{p.note}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
