import React from 'react';
import { Modal } from './ui/Modal';
import { DaySummary } from '../types';
import { formatDateSafe } from '../utils/dateCalc';
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
  if (!daySummary) return null;

  const dateFormatted = formatDateSafe(daySummary.date, 'EEEE, MMMM d, yyyy');

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
      <div className="space-y-5">
        {/* Score banner */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/80">
          <div>
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
              Overall Availability
            </span>
            <span className="text-lg font-bold text-zinc-900">
              {daySummary.availableCount} of {daySummary.totalParticipants} available
            </span>
            {daySummary.maybeCount > 0 && (
              <span className="text-xs text-amber-700 ml-1.5 font-medium">
                (+{daySummary.maybeCount} maybe)
              </span>
            )}
          </div>
          <div className="text-right">
            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
              daySummary.percentage >= 80
                ? 'bg-emerald-100 text-emerald-800'
                : daySummary.percentage >= 50
                ? 'bg-amber-100 text-amber-800'
                : 'bg-zinc-200 text-zinc-700'
            }`}>
              {daySummary.percentage}% match
            </span>
          </div>
        </div>

        {/* Available Friends */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-800 mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Available ({availableList.length})</span>
          </div>
          {availableList.length === 0 ? (
            <p className="text-xs text-zinc-400 italic pl-5">Nobody marked available yet</p>
          ) : (
            <div className="space-y-1.5 pl-2">
              {availableList.map(p => (
                <div key={p.participantId} className="flex items-center justify-between py-1 px-2.5 rounded-lg bg-emerald-50/50 border border-emerald-100">
                  <span className="text-xs font-medium text-zinc-900">{p.participantName}</span>
                  {p.note && (
                    <span className="text-[11px] text-emerald-800 flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      {p.note}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Maybe / If needed Friends */}
        {maybeList.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-800 mb-2">
              <HelpCircle className="w-4 h-4 text-amber-600" />
              <span>Maybe / If needed ({maybeList.length})</span>
            </div>
            <div className="space-y-1.5 pl-2">
              {maybeList.map(p => (
                <div key={p.participantId} className="flex items-center justify-between py-1 px-2.5 rounded-lg bg-amber-50/50 border border-amber-200/60">
                  <span className="text-xs font-medium text-zinc-900">{p.participantName}</span>
                  {p.note && (
                    <span className="text-[11px] text-amber-900 flex items-center gap-1 italic">
                      <MessageSquare className="w-3 h-3" />
                      {p.note}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Busy / Unavailable Friends */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-rose-800 mb-2">
            <XCircle className="w-4 h-4 text-rose-500" />
            <span>Busy / Unavailable ({busyList.length})</span>
          </div>
          {busyList.length === 0 ? (
            <p className="text-xs text-emerald-700 italic pl-5">No one is busy!</p>
          ) : (
            <div className="space-y-1.5 pl-2">
              {busyList.map(p => (
                <div key={p.participantId} className="flex items-center justify-between py-1 px-2.5 rounded-lg bg-zinc-50 border border-zinc-200/60">
                  <span className="text-xs font-medium text-zinc-600">{p.participantName}</span>
                  {p.note && (
                    <span className="text-[11px] text-zinc-500 flex items-center gap-1 italic">
                      <MessageSquare className="w-3 h-3" />
                      {p.note}
                    </span>
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
