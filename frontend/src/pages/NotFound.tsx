import { Link } from "react-router-dom";
import "../styles/not-found.scss";

export default function NotFound() {
  return (
    <div className="not-found-wrapper">
      <div className="not-found-content">
        <h1 className="glitch" data-text="404">
          404
        </h1>
        <h2>Ups! Pagina a dispărut în spațiu.</h2>
        <p>
          Se pare că link-ul pe care l-ai accesat nu există sau a fost mutat. Nu
          te îngrijora, te putem ajuta să te întorci la cursuri!
        </p>
        <div className="actions">
          <Link to="/dashboard" className="btn-primary">
            Înapoi la Dashboard
          </Link>
        </div>
      </div>
      <div className="background-elements">
        <div className="circle orange"></div>
        <div className="circle pink"></div>
      </div>
    </div>
  );
}
