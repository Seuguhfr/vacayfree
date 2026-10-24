import React from 'react';
import { Participant, ParticipantResponse } from '../types';
import { UserPlus, CheckCircle2, User, Lock, LogOut } from 'lucide-react';

interface ParticipantBarProps {
  eventTitle: string;
  eventDescription?: string;
  participants: Participant[];
  responses: ParticipantResponse[];
  currentParticipant: Participant | null;
  isLocked: boolean;
  onAddParticipant: () => void;
  onSelectParticipant: (p: Participant) => void;
  onLogoutParticipant: () => void;
}

export const ParticipantBar: React.FC<ParticipantBarProps> = ({
  eventTitle,
  eventDescription,
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
    <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 sm:p-5 shadow-xs space-y-4">
      {/* Top Section: Title & Primary CTA / Session */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-zinc-950">
            {eventTitle}
          </h1>
          {eventDescription && (
            <p className="text-xs sm:text-sm text-zinc-600 mt-0.5">
              {eventDescription}
            </p>
          )}
        </div>

        {/* Right Action / Active User State */}
        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          {currentParticipant ? (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200/80 px-3 py-1.5 rounded-xl">
              <span className={`w-6 h-6 rounded-full ${currentParticipant.color} text-white font-bold text-[10px] flex items-center justify-center`}>
                {currentParticipant.name.slice(0, 2).toUpperCase()}
              </span>
              <div className="text-left">
                <span className="text-xs font-bold text-emerald-950 block leading-tight">
                  {currentParticipant.name}
                </span>
                <span className="text-[10px] text-emerald-700 font-medium">
                  Editing Mode
                </span>
              </div>
              <button
                type="button"
                onClick={onLogoutParticipant}
                className="ml-2 p-1 rounded-lg text-emerald-700 hover:text-emerald-900 hover:bg-emerald-100 transition-colors cursor-pointer"
                title="Switch friend / Exit edit mode"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            !isLocked && (
              <button
                type="button"
                onClick={onAddParticipant}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer shadow-sm shadow-emerald-600/20"
              >
                <UserPlus className="w-4 h-4 stroke-[2.5]" />
                <span>+ Add Your Dates</span>
              </button>
            )
          )}
        </div>
      </div>

      {/* Bottom Section: Group Overview & Participant Pills */}
      <div className="pt-3 border-t border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-zinc-100 text-zinc-600 flex items-center justify-center">
            <User className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-zinc-800">
            Group Overview ({participants.length} {participants.length === 1 ? 'friend' : 'friends'} responded):
          </span>
        </div>

        {/* Clickable Participant Pills with distinct colored avatar dots */}
        <div className="flex flex-wrap items-center gap-1.5">
          {participants.length === 0 ? (
            <span className="text-xs text-zinc-400 italic">No responses yet — be the first!</span>
          ) : (
            participants.map((p) => {
              const availMap = responseMap.get(p.id) || {};
              const availableCount = Object.values(availMap).filter(d => d.status === 'available').length;
              const isMe = currentParticipant?.id === p.id;

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSelectParticipant(p)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
                    isMe
                      ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                      : 'bg-zinc-50 text-zinc-700 border-zinc-200/80 hover:bg-zinc-100 hover:border-zinc-300'
                  }`}
                  title={isMe ? `Editing as ${p.name}` : `Click to unlock and edit ${p.name}'s dates`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${p.color}`} />
                  <span className="font-semibold">{p.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isMe ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-200 text-zinc-600'
                  }`}>
                    {availableCount}d free
                  </span>
                  {isMe && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                </button>
              );
            })
          )}
        </div>
      </div>

      {isLocked && (
        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/70 text-amber-900 text-xs flex items-center gap-2">
          <Lock className="w-4 h-4 text-amber-600 shrink-0" />
          <span>This poll has been finalized and locked by the organizer. New votes and edits are closed.</span>
        </div>
      )}
    </div>
  );
};
