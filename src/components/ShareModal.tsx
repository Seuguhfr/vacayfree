import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { TripEvent } from '../types';
import { Copy, Check, ShieldAlert, MessageCircle, ExternalLink } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: TripEvent;
  adminKey?: string | null;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  event,
  adminKey,
}) => {
  const [copiedShare, setCopiedShare] = useState(false);
  const [copiedAdmin, setCopiedAdmin] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);

  // Construct current URL
  const baseUrl = window.location.origin + window.location.pathname;
  const shareUrl = `${baseUrl}#event=${event.id}`;
  const adminUrl = adminKey ? `${baseUrl}#event=${event.id}&admin=${adminKey}` : null;

  const handleCopy = (text: string, type: 'share' | 'admin' | 'msg') => {
    navigator.clipboard.writeText(text);
    if (type === 'share') {
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    } else if (type === 'admin') {
      setCopiedAdmin(true);
      setTimeout(() => setCopiedAdmin(false), 2000);
    } else {
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2000);
    }
  };

  const inviteMessage = `Hey everyone! Let's find the best dates for our "${event.title}" vacation. Pick your free days here: ${shareUrl}`;

  const openWhatsApp = () => {
    const waUrl = `https://wa.me/?text=${encodeURIComponent(inviteMessage)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Trip Poll" maxWidthClass="max-w-md">
      <div className="space-y-5">
        {/* Friend Share Link */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1.5">
            Shareable Link for Friends
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-700 text-xs font-mono select-all focus:outline-none"
            />
            <button
              type="button"
              onClick={() => handleCopy(shareUrl, 'share')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer shadow-xs"
            >
              {copiedShare ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            Anyone with this link can select their free days. No account required!
          </p>
        </div>

        {/* Quick WhatsApp / Message */}
        <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              Quick Group Chat Message
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleCopy(inviteMessage, 'msg')}
                className="text-[11px] font-medium text-emerald-700 hover:text-emerald-800 transition-colors"
              >
                {copiedMessage ? 'Copied text!' : 'Copy text'}
              </button>
            </div>
          </div>
          <p className="text-xs text-zinc-600 bg-white p-2.5 rounded-lg border border-zinc-200/60 font-sans leading-relaxed">
            "{inviteMessage}"
          </p>
          <button
            type="button"
            onClick={openWhatsApp}
            className="w-full inline-flex items-center justify-center gap-2 py-2 rounded-lg bg-emerald-600/10 text-emerald-800 hover:bg-emerald-600/20 text-xs font-semibold transition-colors cursor-pointer"
          >
            <span>Send directly on WhatsApp</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        {/* Admin Link if available */}
        {adminUrl && (
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Organizer Secret Link (Admin Key)</span>
            </div>
            <p className="text-[11px] text-amber-800/90 leading-tight">
              Bookmark this link! It contains the admin key to edit event details or lock the poll.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={adminUrl}
                className="flex-1 px-3 py-1.5 rounded-lg border border-amber-200 bg-white text-amber-950 text-xs font-mono select-all focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleCopy(adminUrl, 'admin')}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 text-white hover:bg-amber-700 active:scale-95 transition-all cursor-pointer"
              >
                {copiedAdmin ? <Check className="w-3 h-3 stroke-[2.5]" /> : <Copy className="w-3 h-3" />}
                <span>{copiedAdmin ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
