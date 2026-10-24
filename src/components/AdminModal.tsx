import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { TripEvent, Participant } from '../types';
import { hashString } from '../utils/security';
import { StorageService } from '../services/storage';
import { ShieldCheck, Lock, Unlock, Trash2, KeyRound } from 'lucide-react';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: TripEvent;
  participants: Participant[];
  isAdmin: boolean;
  onVerifyAdmin: (adminKey: string) => Promise<boolean>;
  onUpdateEvent: (updated: Partial<TripEvent>) => void;
  onDeleteParticipant: (participantId: string) => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  event,
  participants,
  isAdmin,
  onVerifyAdmin,
  onUpdateEvent,
  onDeleteParticipant,
}) => {
  const [inputKey, setInputKey] = useState('');
  const [keyError, setKeyError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Editable fields
  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description || '');
  const [startDate, setStartDate] = useState(event.startDate);
  const [endDate, setEndDate] = useState(event.endDate);
  const [isLocked, setIsLocked] = useState(event.isLocked);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setKeyError(null);
    setIsVerifying(true);
    const valid = await onVerifyAdmin(inputKey.trim());
    setIsVerifying(false);
    if (!valid) {
      setKeyError('Invalid organizer key.');
    }
  };

  const handleSaveChanges = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateEvent({
      title: title.trim(),
      description: description.trim() || undefined,
      startDate,
      endDate,
      isLocked,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleResetPin = async (p: Participant) => {
    const defaultPin = '1234';
    const pinHash = await hashString(defaultPin);
    // Update participant pinHash
    const data = StorageService.getEvent(event.id);
    if (data) {
      data.participants = data.participants.map(part =>
        part.id === p.id ? { ...part, pinHash } : part
      );
      StorageService.saveEvent(data);
      alert(`PIN for ${p.name} has been reset to "1234"`);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isAdmin ? 'Organizer Controls' : 'Unlock Organizer Controls'}
      maxWidthClass="max-w-lg"
    >
      {!isAdmin ? (
        <form onSubmit={handleVerify} className="space-y-4">
          <p className="text-xs text-zinc-600">
            Enter your secret organizer admin key to unlock settings and manage responses.
          </p>
          {keyError && (
            <div className="p-2.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
              {keyError}
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1">
              Admin Key
            </label>
            <div className="flex items-center gap-2">
              <input
                type="password"
                required
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="Paste your organizer key"
                className="flex-1 px-3 py-2 rounded-xl border border-zinc-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
              <button
                type="submit"
                disabled={isVerifying}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isVerifying ? 'Checking...' : 'Unlock'}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
            <span className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              Organizer mode unlocked
            </span>
            <span className="text-[11px] text-amber-800 font-mono">
              Event ID: {event.id}
            </span>
          </div>

          <form onSubmit={handleSaveChanges} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1">
                Trip Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 text-xs"
                />
              </div>
            </div>

            {/* Lock Poll Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-200/80">
              <div>
                <div className="text-xs font-semibold text-zinc-800 flex items-center gap-1.5">
                  {isLocked ? <Lock className="w-3.5 h-3.5 text-rose-600" /> : <Unlock className="w-3.5 h-3.5 text-emerald-600" />}
                  <span>{isLocked ? 'Poll is Locked' : 'Poll is Open'}</span>
                </div>
                <p className="text-[11px] text-zinc-500">
                  {isLocked ? 'Nobody can edit availability now.' : 'Friends can freely mark and update dates.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsLocked(!isLocked)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                  isLocked
                    ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                {isLocked ? 'Unlock' : 'Lock Poll'}
              </button>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-emerald-600 font-medium">
                {saveSuccess ? 'Changes saved!' : ''}
              </span>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Save Settings
              </button>
            </div>
          </form>

          {/* Manage Participants */}
          <div className="pt-4 border-t border-zinc-100">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-2">
              Manage Participants ({participants.length})
            </h3>
            <div className="divide-y divide-zinc-100 max-h-48 overflow-y-auto rounded-xl border border-zinc-200 bg-white">
              {participants.length === 0 ? (
                <p className="p-3 text-xs text-zinc-400 text-center">No participants yet</p>
              ) : (
                participants.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-2.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${p.color}`} />
                      <span className="text-xs font-medium text-zinc-800">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleResetPin(p)}
                        title="Reset PIN to 1234"
                        className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Reset PIN</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Remove ${p.name} and their responses?`)) {
                            onDeleteParticipant(p.id);
                          }
                        }}
                        title="Delete participant"
                        className="p-1 rounded-md text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};
