interface ConfirmModalProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  message,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <p>{message}</p>
        <div className="modal-actions">
          <button className="btn--outline" onClick={onCancel}>
            Nu
          </button>
          <button className="btn--primary" onClick={onConfirm}>
            Da
          </button>
        </div>
      </div>
    </div>
  );
}
