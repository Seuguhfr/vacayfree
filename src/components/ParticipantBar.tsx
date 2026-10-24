import React from 'react';
import { Participant, ParticipantResponse } from '../types';
import { UserPlus, CheckCircle2, User, Lock, LogOut } from 'lucide-react';

interface ParticipantBarProps {
  participants: Participant[];
  responses: ParticipantResponse[];
  currentParticipant: Participant | null;
  isLocked: boolean;
  onAddParticipant: () => void;
  onSelectParticipant: (p: Participant) => void;
  onLogoutParticipant: () => void;
}

export const ParticipantBar: React.FC<ParticipantBarProps> = ({
  participants,
  responses,
  currentParticipant,
  isLocked,
  onAddParticipant,
  onSelectParticipant,
  onLogoutParticipant,
}) => {
  const responseMap = new Map(responses.map(r => [r.participantId, r.availability]));

  return (
    <div className="bg-white rounded-2xl border border-zinc-200/80 p-3 sm:p-4 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Active session info or participant overview */}
        <div className="flex items-center gap-2">
          {currentParticipant ? (
            <div className="flex items-center gap-2.5">
              <span className={`w-8 h-8 rounded-full ${currentParticipant.color} text-white font-semibold text-xs flex items-center justify-center ring-2 ring-emerald-500/30`}>
                {currentParticipant.name.slice(0, 2).toUpperCase()}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-900">
                    You ({currentParticipant.name})
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md">
                    Editing Mode
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500">
                  Paint your dates on the calendar below
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-600 flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-zinc-900 block">
                  Group Overview ({participants.length} {participants.length === 1 ? 'friend' : 'friends'})
                </span>
                <span className="text-[11px] text-zinc-500">
                  {participants.length === 0
                    ? 'Be the first to add your dates!'
                    : 'Viewing all responses on the heatmap'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {currentParticipant ? (
            <button
              type="button"
              onClick={onLogoutParticipant}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
              title="Switch user or return to group heatmap"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Switch User</span>
            </button>
          ) : (
            !isLocked && (
              <button
                type="button"
                onClick={onAddParticipant}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer shadow-xs"
              >
                <UserPlus className="w-3.5 h-3.5 stroke-[2.2]" />
                <span>+ Add Your Dates</span>
              </button>
            )
          )}
        </div>
      </div>

      {/* Participant avatar badges list */}
      {participants.length > 0 && (
        <div className="mt-3 pt-3 border-t border-zinc-100 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider mr-1">
            Responses:
          </span>
          {participants.map((p) => {
            const availMap = responseMap.get(p.id) || {};
            const availableCount = Object.values(availMap).filter(d => d.status === 'available').length;
            const isMe = currentParticipant?.id === p.id;

            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelectParticipant(p)}
                className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
                  isMe
                    ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                    : 'bg-zinc-50 text-zinc-700 border-zinc-200/80 hover:bg-zinc-100 hover:border-zinc-300'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${p.color}`} />
                <span>{p.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isMe ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-200 text-zinc-600'
                }`}>
                  {availableCount}d free
                </span>
                {isMe && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
              </button>
            );
          })}
        </div>
      )}

      {isLocked && (
        <div className="mt-3 p-2 rounded-xl bg-amber-50 border border-amber-200/70 text-amber-800 text-xs flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>This poll has been finalized and locked by the organizer.</span>
        </div>
      )}
    </div>
  );
};
