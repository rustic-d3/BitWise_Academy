import { useRef, useState } from "react";
import api from "../api";

interface Props {
  lessonId: number;
  upload_end_point: "upload-test" | "upload-material";
  onClose: () => void;
}

export default function UploadPdfModal({
  lessonId,
  onClose,
  upload_end_point,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

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
        `api/lessons/${lessonId}/${upload_end_point}/`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      console.log(response);

      if (response.status === 201 || response.status === 200) {
        setIsSuccess(true);
      }
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
        {isSuccess ? (
          <div
            className="success-screen"
            style={{
              textAlign: "center",
              padding: "20px 0",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <h1 style={{ fontSize: "50px", margin: "0 0 15px 0" }}>
              <svg
                width="44"
                height="44"
                viewBox="0 0 44 44"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M4.88801 22.0056C4.8872 19.2735 5.54061 16.5809 6.7936 14.1531C8.04659 11.7252 9.86273 9.63272 12.0901 8.05056C14.3175 6.4684 16.8913 5.4426 19.5964 5.05895C22.3014 4.67531 25.059 4.94497 27.6384 5.8454C28.2508 6.05869 28.9227 6.02 29.5065 5.73784C30.0903 5.45569 30.5381 4.95317 30.7514 4.34084C30.9647 3.72852 30.926 3.05654 30.6439 2.47274C30.3617 1.88894 29.8592 1.44114 29.2469 1.22784C24.7426 -0.343585 19.8496 -0.408339 15.3053 1.04334C10.7611 2.49502 6.81178 5.38447 4.05273 9.27619C1.29368 13.1679 -0.125629 17.851 0.00873202 22.6196C0.143093 27.3882 1.82384 31.984 4.79764 35.7142C7.77145 39.4444 11.8772 42.1069 16.496 43.3004C21.1148 44.4939 25.9964 44.1537 30.405 42.3311C34.8136 40.5086 38.5104 37.3024 40.9381 33.1958C43.3658 29.0892 44.393 24.3048 43.8646 19.5636C43.8293 19.2445 43.7315 18.9355 43.5768 18.6543C43.4221 18.373 43.2134 18.1249 42.9629 17.9243C42.7123 17.7236 42.4246 17.5743 42.1163 17.4848C41.808 17.3953 41.4851 17.3674 41.166 17.4027C40.8469 17.438 40.5379 17.5359 40.2566 17.6906C39.9753 17.8453 39.7273 18.0539 39.5266 18.3045C39.326 18.5551 39.1766 18.8428 39.0872 19.1511C38.9977 19.4594 38.9698 19.7823 39.0051 20.1014C39.2626 22.4136 39.0458 24.754 38.3681 26.9796C37.6904 29.2052 36.566 31.2692 35.0635 33.0454C33.5611 34.8217 31.7122 36.273 29.6299 37.3105C27.5476 38.348 25.2755 38.9499 22.9527 39.0796C20.6298 39.2092 18.3049 38.8638 16.1201 38.0645C13.9352 37.2652 11.9363 36.0287 10.2455 34.4306C8.55476 32.8326 7.20762 30.9065 6.28645 28.7702C5.36529 26.6338 4.88945 24.3321 4.88801 22.0056ZM40.9435 8.95718C41.3727 8.47095 41.5912 7.83414 41.5508 7.18685C41.5105 6.53956 41.2147 5.9348 40.7284 5.50562C40.2422 5.07644 39.6054 4.858 38.9581 4.89834C38.3108 4.93868 37.7061 5.2345 37.2769 5.72073L21.5469 23.5163L13.7662 17.1778C13.5174 16.975 13.2311 16.8231 12.9237 16.7308C12.6162 16.6386 12.2935 16.6079 11.9742 16.6403C11.3292 16.7059 10.7366 17.025 10.3269 17.5274C10.124 17.7762 9.97213 18.0625 9.8799 18.37C9.78767 18.6774 9.7569 19.0001 9.78936 19.3195C9.85492 19.9645 10.174 20.557 10.6765 20.9667L20.2807 28.7889C20.77 29.187 21.3942 29.3806 22.0229 29.3291C22.6515 29.2776 23.236 28.9851 23.654 28.5127L40.9435 8.95718Z"
                  fill="#13E92C"
                />
              </svg>
            </h1>

            {upload_end_point === "upload-test" ? (
              <h3 className="modal-title" style={{ marginBottom: "10px" }}>
                Test Generat cu Succes!
              </h3>
            ) : (
              <h3 className="modal-title">Material încărcat cu succes!</h3>
            )}
            {upload_end_point === "upload-test" ? (
              <p style={{ marginBottom: "25px", color: "#ccc" }}>
                Fișierul PDF a fost procesat, iar întrebările sunt gata pentru
                elevi.
              </p>
            ) : (
              <p style={{ marginBottom: "25px", color: "#ccc" }}>
                Fișierul PDF a fost procesat, iar materialul a fost încărcat!
              </p>
            )}

            <button className="btn--primary" onClick={onClose}>
              Revino în Dashboard
            </button>
          </div>
        ) : (
          <>
            {upload_end_point === "upload-test" ? (
              <h3 className="modal-title">Încarcă Test</h3>
            ) : (
              <h3 className="modal-title">Încarcă Material</h3>
            )}

            <div
              className="upload-area"
              onClick={() => inputRef.current?.click()}
            >
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
                        fillRule="evenodd"
                        clipRule="evenodd"
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
                {uploading ? "Se generează..." : "Trimite"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
