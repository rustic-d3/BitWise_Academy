import { useRef, useState } from "react";
import api from "../api";

interface Props {
  lessonId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UploadTestModal({
  lessonId,
  onClose,
  onSuccess,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.type !== "application/pdf") {
      setError("Doar fișiere PDF sunt acceptate.");
      setFile(null);
      return;
    }

    setError(null);
    setFile(selected);
  };

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    setError(null);

    try {
      const response = await api.post(
        `api/lessons/${lessonId}/upload-test/`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      console.log(response);
      onSuccess();
      onClose();
    } catch (err) {
      setError("Upload eșuat. Încearcă din nou.");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h3 className="modal-title">Încarcă Test</h3>

        <div className="upload-area" onClick={() => inputRef.current?.click()}>
          {file ? (
            <div className="file-content">
              <p className="file-name">
                <svg
                  width="24"
                  height="26"
                  viewBox="0 0 12 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M2.52167 9.48483C2.1209 9.24042 1.64769 9.14278 1.18292 9.20858H0V13.4586H0.942083V11.8365H1.34583C1.7641 11.8795 2.18439 11.7769 2.53583 11.5461C2.83414 11.2902 2.99862 10.9117 2.98208 10.519C3.00417 10.1202 2.83277 9.73525 2.52167 9.48483ZM1.76375 11.0361C1.58581 11.1144 1.39017 11.1437 1.19708 11.1211H0.920833V9.91691H1.19708C1.39768 9.89559 1.60005 9.93508 1.77792 10.0302C1.94356 10.1456 2.03743 10.3387 2.02583 10.5402C2.04729 10.7434 1.94371 10.9394 1.76375 11.0361ZM5.00792 9.20858H3.83208V13.4586H4.95833C5.53231 13.5147 6.11029 13.4041 6.62292 13.1398C7.18697 12.7194 7.48832 12.0334 7.41625 11.3336C7.45847 10.7341 7.24487 10.1447 6.82833 9.71149C6.31381 9.30595 5.65766 9.12468 5.00792 9.20858ZM5.94292 12.4952C5.64782 12.6611 5.30991 12.7351 4.9725 12.7077H4.78833V9.95941H4.95833C5.55333 9.95941 5.78708 10.0161 6.02083 10.2286C6.30452 10.5239 6.45103 10.9249 6.42458 11.3336C6.46102 11.7759 6.28163 12.2085 5.94292 12.4952ZM8.45042 13.4586H9.40667V11.6807H11.3333V10.9298H9.40667V9.95941H11.3333V9.20858H8.45042V13.4586ZM7.79167 0.000244141H0V7.79191H1.41667V6.37524V5.63149V1.41691H7.20375L9.91667 4.12983V5.63149V6.37524V7.79191H11.3333V3.54191L7.79167 0.000244141Z"
                    fill="black"
                  />
                </svg>
                {file.name}
              </p>
            </div>
          ) : (
            <>
              <p>Apasă pentru a selecta un fișier PDF</p>
              <span className="upload-hint">Doar fișiere .pdf</span>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
        </div>

        {error && <p className="upload-error">{error}</p>}

        <div className="modal-actions">
          <button
            className="btn--outline"
            onClick={onClose}
            disabled={uploading}
          >
            Anulează
          </button>
          <button
            className="btn--primary"
            onClick={handleUpload}
            disabled={!file || uploading}
          >
            {uploading ? "Se încarcă..." : "Trimite"}
          </button>
        </div>
      </div>
    </div>
  );
}
