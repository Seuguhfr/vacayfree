import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidthClass?: string;
  showCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidthClass = 'max-w-md',
  showCloseButton = true,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useRef(`modal-title-${Math.random().toString(36).slice(2, 9)}`).current;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
      // Focus modal container itself on mount rather than close button
      dialog.focus();
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  // Handle native cancel (Esc key)
  const handleCancel = (e: React.SyntheticEvent) => {
    e.preventDefault();
    onClose();
  };

  // Modern Web Guidance: Light-dismiss fallback for browsers without closedBy support (like Safari)
  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (e.target !== dialog) return;

    const rect = dialog.getBoundingClientRect();
    const isInsideContent =
      rect.top <= e.clientY &&
      e.clientY <= rect.top + rect.height &&
      rect.left <= e.clientX &&
      e.clientX <= rect.left + rect.width;

    if (!isInsideContent) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const maxW =
    maxWidthClass === 'max-w-sm'
      ? '384px'
      : maxWidthClass === 'max-w-lg'
      ? '560px'
      : maxWidthClass === 'max-w-xl'
      ? '640px'
      : '480px';

  return (
    <dialog
      ref={dialogRef}
      tabIndex={-1}
      onCancel={handleCancel}
      onClick={handleBackdropClick}
      {...({ closedby: 'any' } as Record<string, string>)}
      aria-labelledby={titleId}
      className="fixed inset-0 m-auto w-[92vw] sm:w-full p-0 rounded-2xl bg-white text-zinc-900 shadow-2xl border border-zinc-200/90 outline-none focus:outline-none max-h-[90dvh] flex flex-col overflow-x-hidden"
      style={{
        maxWidth: maxW,
        backgroundColor: '#ffffff',
      }}
    >
      <div className="flex items-center justify-between border-b border-zinc-100 px-5 sm:px-6 py-4 bg-white shrink-0">
        <h2 id={titleId} className="text-base sm:text-lg font-bold tracking-tight text-zinc-900">
          {title}
        </h2>
        {showCloseButton && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      <div className="p-5 sm:p-6 pb-8 sm:pb-8 flex-1 min-h-0 overflow-y-auto overflow-x-hidden bg-white">{children}</div>
    </dialog>
  );
};
