import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      className="bg-bg-card border border-border-color rounded-2xl p-0 max-w-md w-[90%] shadow-card text-text-primary backdrop:bg-black/60 backdrop:backdrop-blur-sm"
      onClose={onClose}
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-border-color">
        <h2 className="text-xl font-semibold">{title}</h2>
        <button
          className="bg-none border-none text-text-secondary cursor-pointer p-1 rounded-lg transition-all duration-200 hover:bg-bg-hover hover:text-text-primary"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      <div className="p-6">{children}</div>
    </dialog>
  );
}
