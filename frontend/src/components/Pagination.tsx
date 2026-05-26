import "../styles/_pagination.scss";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  onNext: () => void;
  onPrev: () => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  hasNext,
  hasPrev,
  onNext,
  onPrev,
}: PaginationProps) {
  // Dacă nu avem pagini sau există o singură pagină, nu randăm componenta deloc
  if (totalPages <= 1) return null;

  return (
    <div className="pagination-container">
      <button
        className="btn--secondary"
        onClick={onPrev}
        disabled={!hasPrev}
        aria-label="Pagina Anterioară"
      >
        &laquo; Înapoi
      </button>

      <div className="pagination-info">
        <span>Pagina</span>
        <span className="current-page">{currentPage}</span>
        <span>din</span>
        <span className="total-pages">{totalPages}</span>
      </div>

      <button
        className="btn--primary"
        onClick={onNext}
        disabled={!hasNext}
        aria-label="Pagina Următoare"
      >
        Înainte &raquo;
      </button>
    </div>
  );
}