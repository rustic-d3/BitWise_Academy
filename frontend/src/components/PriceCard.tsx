import "../styles/pricing_card.scss";
import { useNavigate } from "react-router-dom";

const CheckIcon = () => (
  <svg
    className="check-icon"
    viewBox="0 0 22 22"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="11" cy="11" r="11" fill="rgba(255,255,255,0.15)" />
    <circle
      cx="11"
      cy="11"
      r="10"
      stroke="rgba(255,255,255,0.5)"
      strokeWidth="1"
    />
    <path
      d="M6.5 11L9.5 14L15.5 8"
      stroke="white"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

interface PricingCardProps {
  cardId: number;
  title: string;
  price: string;
  message: string;
  features: Array<string>;
  button_type: "black" | "premium" | string;
}

export default function PricingCard({
  cardId,
  title,
  price,
  message,
  features,
  button_type,
}: PricingCardProps) {
  const navigate = useNavigate();
  return (
    <div className="pricing-card">
      <div className="pricing-card__highlight" />

      <p className="pricing-card__label">{title}</p>

      <div className="pricing-card__price-row">
        <span className="pricing-card__price">{price}$</span>
        <span className="pricing-card__per-user">&nbsp;/ utilizator</span>
      </div>

      <p className="pricing-card__subtitle">{message}</p>

      <div className="pricing-card__divider" />

      <ul className="pricing-card__features">
        {features.map((feature, i) => (
          <li key={i} className="pricing-card__feature">
            <CheckIcon />
            <span className="pricing-card__feature-text">{feature}</span>
          </li>
        ))}
      </ul>

      <button
        className={`pricing-card--${button_type}`}
        onClick={() =>
          navigate(`/subscription-form?cardId=${cardId}`, {
            state: { fromRestricted: true },
          })
        }
      >
        Achiziționează
      </button>
    </div>
  );
}
