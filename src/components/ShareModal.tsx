import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { TripEvent } from '../types';
import { useTranslation } from '../i18n/LanguageContext';
import { Copy, Check, MessageCircle } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: TripEvent;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  event,
}) => {
  const { t } = useTranslation();
  const [copiedShare, setCopiedShare] = useState(false);

  // Construct shareable query URL (compatible with crawlers & previews)
  const baseUrl = window.location.origin + window.location.pathname;
  const shareUrl = `${baseUrl}?event=${event.id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  const inviteMessage = t.inviteMessageText(event.title, shareUrl);

  const openWhatsApp = () => {
    const waUrl = `https://wa.me/?text=${encodeURIComponent(inviteMessage)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t.shareModalTitle} maxWidthClass="max-w-md">
      <div className="space-y-4">
        {/* Friend Link */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1.5">
            {t.shareableLinkChat}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-800 text-xs font-mono select-all focus:outline-none"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer shadow-xs shrink-0"
            >
              {copiedShare ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{t.copiedBtn}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>{t.copyBtn}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* WhatsApp Direct Share Button */}
        <div>
          <button
            type="button"
            onClick={openWhatsApp}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{t.whatsappBtn}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
