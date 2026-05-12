import Navbar from "../components/Navbar";
import PricingCard from "../components/PriceCard"; // Make sure this matches your file name
import "../styles/subscriptions.scss";

export default function SubscriptionsPage() {
  const features_card1 = [
    "Acces la resurse educaționale",
    "1 Lecție de probă Gratuită",
    "Acces la 4 ore",
  ];
  const features_card2 = [
    "Tot din Pachetul Lunar",
    "Acces la resurse AI",
    "Acces la 48 ore",
  ];

  return (
    <div className="page-wrapper-subscriptions">
      <Navbar role="parent" />

      <main className="main-content-subscriptions">
        <h1 className="main-title">
          Alege oferta potrivită pentru copilul tău!
        </h1>
        <PricingCard
          cardId={1}
          title="Pachetul lunar"
          price="9.99"
          message="Investește în educația copilului tău cu strictul necesar!"
          features={features_card1}
          button_type="black"
        />
        <PricingCard
          cardId={2}
          title="Pachetul anual"
          price="19.99"
          message="Sparge limitele cu funcții nelimitate!"
          features={features_card2}
          button_type="premium"
        />
      </main>
    </div>
  );
}
