import "../styles/_info_card.scss";

export interface InfoCardData {
  first_name: string;
  last_name: string;
  description: string;
}

interface InfoCardProps {
  data?: InfoCardData | null;
}
export default function InfoCard({ data }: InfoCardProps) {
  if (!data) {
    return <div>Loading card...</div>;
  }
  return (
    <div className="card-container">
      <div className="decorator-container">
        <img src="/avatar.png" alt="avatar_photo" />
      </div>
      <div className="info-container">
        <h1>
          {data.first_name} {data.last_name}
        </h1>
        <p>{data.description}</p>
        <button className="btn--outline">
          <svg
            width="15"
            height="15"
            viewBox="0 0 15 15"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0.730469 5.11055H13.8718M5.11091 9.49099L6.57106 10.9511L9.49136 8.03084M3.65076 0.730103V2.19025M10.9515 0.730103V2.19025M3.0667 13.8714H11.5356C12.3533 13.8714 12.7622 13.8714 13.0746 13.7123C13.3493 13.5723 13.5727 13.3489 13.7126 13.0742C13.8718 12.7619 13.8718 12.353 13.8718 11.5352V4.52649C13.8718 3.70872 13.8718 3.29985 13.7126 2.98751C13.5727 2.71276 13.3493 2.48938 13.0746 2.3494C12.7622 2.19025 12.3533 2.19025 11.5356 2.19025H3.0667C2.24895 2.19025 1.84006 2.19025 1.52772 2.3494C1.25298 2.48938 1.0296 2.71276 0.889617 2.98751C0.730469 3.29985 0.730469 3.70872 0.730469 4.52649V11.5352C0.730469 12.353 0.730469 12.7619 0.889617 13.0742C1.0296 13.3489 1.25298 13.5723 1.52772 13.7123C1.84006 13.8714 2.24894 13.8714 3.0667 13.8714Z"
              stroke="#FF6116"
              stroke-width="1.46015"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          Setează Recuperare
        </button>
      </div>
    </div>
  );
}
