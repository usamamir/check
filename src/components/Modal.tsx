import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

export function Modal({
  title,
  children,
  footer,
  onClose,
}: {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal"
        role="dialog"
        aria-modal
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{title}</h3>
          <button className="btn-icon" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer ? <div className="modal-footer">{footer}</div> : null}
      </div>
    </div>
  );
}
