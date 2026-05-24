interface ConfirmModalProps {
  message: string;
  onCancel: () => void;
}

export default function InfoModal({ message, onCancel }: ConfirmModalProps) {
  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <p>{message}</p>
        <div className="modal-actions">
          <button className="btn--outline" onClick={onCancel}>
            Închide
          </button>
        </div>
      </div>
    </div>
  );
}
