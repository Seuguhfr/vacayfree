import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { TripEvent } from '../types';
import { useTranslation } from '../i18n/LanguageContext';
import { Copy, Check, MessageCircle, ExternalLink, ShieldCheck } from 'lucide-react';

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
  const [copiedMessage, setCopiedMessage] = useState(false);

  // Construct shareable query URL (compatible with crawlers & previews)
  const baseUrl = window.location.origin + window.location.pathname;
  const shareUrl = `${baseUrl}?event=${event.id}`;

  const handleCopy = (text: string, type: 'share' | 'msg') => {
    navigator.clipboard.writeText(text);
    if (type === 'share') {
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    } else {
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2000);
    }
  };

  const inviteMessage = t.inviteMessageText(event.title, shareUrl);

  const openWhatsApp = () => {
    const waUrl = `https://wa.me/?text=${encodeURIComponent(inviteMessage)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t.shareModalTitle} maxWidthClass="max-w-md">
      <div className="space-y-4">
        {/* Safe Friend Link */}
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
              onClick={() => handleCopy(shareUrl, 'share')}
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
          <p className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{t.safeLinkNotice}</span>
          </p>
        </div>

        {/* WhatsApp & Group Message Card */}
        <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              {t.quickGroupMessageTitle}
            </span>
            <button
              type="button"
              onClick={() => handleCopy(inviteMessage, 'msg')}
              className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 transition-colors cursor-pointer"
            >
              {copiedMessage ? t.copiedMessageToast : t.copyMessageBtn}
            </button>
          </div>
          <p className="text-xs text-zinc-700 bg-white p-2.5 rounded-lg border border-zinc-200/60 leading-relaxed font-sans">
            "{inviteMessage}"
          </p>
          <button
            type="button"
            onClick={openWhatsApp}
            className="w-full inline-flex items-center justify-center gap-2 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold transition-colors cursor-pointer shadow-xs"
          >
            <span>{t.whatsappBtn}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </Modal>
  );
};
