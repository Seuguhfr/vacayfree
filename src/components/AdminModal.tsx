import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { TripEvent, Participant } from '../types';
import { hashParticipantPin } from '../utils/security';
import { StorageService } from '../services/storage';
import { ShieldCheck, Lock, Unlock, Trash2, KeyRound, Copy, Check } from 'lucide-react';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: TripEvent;
  participants: Participant[];
  isAdmin: boolean;
  adminKey: string | null;
  onVerifyAdmin: (adminKey: string) => Promise<boolean>;
  onUpdateEvent: (updated: Partial<TripEvent>) => void;
  onDeleteParticipant: (participantId: string) => void;
  onDeletePoll?: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  event,
  participants,
  isAdmin,
  adminKey,
  onVerifyAdmin,
  onUpdateEvent,
  onDeleteParticipant,
  onDeletePoll,
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
  const [copiedAdminUrl, setCopiedAdminUrl] = useState(false);
  const [pinResetNotice, setPinResetNotice] = useState<{ name: string; tempPin: string } | null>(null);

  // Organizer Admin URL
  const baseUrl = window.location.origin + window.location.pathname;
  const adminUrl = adminKey ? `${baseUrl}?event=${event.id}&admin=${adminKey}` : null;

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

  const handleToggleLock = () => {
    const nextLocked = !isLocked;
    setIsLocked(nextLocked);
    onUpdateEvent({ isLocked: nextLocked });
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
    // Generate a fresh clean 4-digit PIN with salted hash
    const tempPin = Math.floor(1000 + Math.random() * 9000).toString();
    const pinHash = await hashParticipantPin(event.id, p.id, tempPin);

    const data = StorageService.getEvent(event.id);
    if (data) {
      data.participants = data.participants.map(part =>
        part.id === p.id ? { ...part, pinHash } : part
      );
      StorageService.saveEvent(data);
    }
    setPinResetNotice({ name: p.name, tempPin });
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
        <div className="space-y-5">
          {/* Organizer Key Card (Kept safe from share modal) */}
          {adminUrl && (
            <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-950 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold flex items-center gap-1.5 text-amber-900">
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  Your Secret Organizer Link
                </span>
                <span className="text-[10px] text-amber-700 font-mono">Private</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-tight">
                Bookmark this link to maintain admin access. Do not share this in the group chat!
              </p>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  readOnly
                  value={adminUrl}
                  className="flex-1 px-2.5 py-1.5 rounded-lg border border-amber-300/80 bg-white text-xs font-mono select-all focus:outline-none text-zinc-800"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(adminUrl);
                    setCopiedAdminUrl(true);
                    setTimeout(() => setCopiedAdminUrl(false), 2000);
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-700 text-white hover:bg-amber-800 cursor-pointer"
                >
                  {copiedAdminUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedAdminUrl ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Temporary PIN Reset Notification */}
          {pinResetNotice && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold block">
                  PIN for {pinResetNotice.name} reset to: <span className="font-mono text-sm underline">{pinResetNotice.tempPin}</span>
                </span>
                <span className="text-[11px] text-emerald-700">Text this 4-digit code to your friend.</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(pinResetNotice.tempPin);
                  alert(`Copied PIN "${pinResetNotice.tempPin}" to clipboard!`);
                  setPinResetNotice(null);
                }}
                className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700"
              >
                Copy PIN
              </button>
            </div>
          )}

          {/* Trip Settings Form */}
          <form onSubmit={handleSaveChanges} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1">
                Trip Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
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
                className="w-full px-3 py-1.5 rounded-xl border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-zinc-500 mb-0.5">
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
                <label className="block text-[11px] font-medium text-zinc-500 mb-0.5">
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

            {/* Instant Lock Poll Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-200/80">
              <div>
                <div className="text-xs font-semibold text-zinc-800 flex items-center gap-1.5">
                  {isLocked ? <Lock className="w-3.5 h-3.5 text-rose-600" /> : <Unlock className="w-3.5 h-3.5 text-emerald-600" />}
                  <span>{isLocked ? 'Poll is Locked' : 'Poll is Open for responses'}</span>
                </div>
                <p className="text-[11px] text-zinc-500">
                  {isLocked ? 'Friends cannot edit their dates while locked.' : 'Friends can freely mark and update dates.'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleToggleLock}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                  isLocked
                    ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                }`}
              >
                {isLocked ? 'Unlock Poll' : 'Lock Poll'}
              </button>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-emerald-600 font-semibold">
                {saveSuccess ? '✓ Settings updated!' : ''}
              </span>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Save Settings
              </button>
            </div>
          </form>

          {/* Manage Participants with visible scroll and count */}
          <div className="pt-3 border-t border-zinc-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
                Manage Participants ({participants.length})
              </h3>
              <span className="text-[10px] text-zinc-400">Scrollable list</span>
            </div>
            <div className="divide-y divide-zinc-100 max-h-56 overflow-y-auto rounded-xl border border-zinc-200 bg-white shadow-inner">
              {participants.length === 0 ? (
                <p className="p-3 text-xs text-zinc-400 text-center">No participants yet</p>
              ) : (
                participants.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-2.5 hover:bg-zinc-50/50">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${p.color}`} />
                      <span className="text-xs font-medium text-zinc-800">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleResetPin(p)}
                        title="Generate temporary PIN"
                        className="px-2 py-1 rounded-md text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors text-[11px] flex items-center gap-1 border border-zinc-200 cursor-pointer"
                      >
                        <KeyRound className="w-3 h-3" />
                        <span>Reset PIN</span>
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

          {/* Danger Zone: Permanent Poll Deletion */}
          {onDeletePoll && (
            <div className="pt-4 border-t border-rose-100">
              <div className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                    <Trash2 className="w-4 h-4 text-rose-600" />
                    <span>Delete Vacation Poll</span>
                  </div>
                  <p className="text-[11px] text-rose-700 mt-0.5 leading-tight">
                    Permanently delete this poll and all responses from cloud and storage.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to permanently delete "${event.title}"? This cannot be undone.`)) {
                      onDeletePoll();
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors cursor-pointer shrink-0"
                >
                  Delete Poll
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};
