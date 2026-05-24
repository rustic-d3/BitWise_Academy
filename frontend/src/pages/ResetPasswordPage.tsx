import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import "../styles/_reset_password.scss"; // Asigură-te că calea e corectă

export default function ResetPasswordPage() {
  const { uidb64, token } = useParams<{ uidb64: string; token: string }>();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "Parolele nu coincid!" });
      return;
    }

    if (password.length < 8) {
      setMessage({
        type: "error",
        text: "Parola trebuie să aibă cel puțin 8 caractere.",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post(
        `api/password-reset-confirm/${uidb64}/${token}/`,
        {
          new_password: password,
        },
      );

      if (response.status === 200) {
        setMessage({
          type: "success",
          text: "Parola a fost resetată cu succes! Te redirecționăm...",
        });
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      }
    } catch (error: any) {
      setMessage({
        type: "error",
        text:
          error.response?.data?.error ||
          "Link invalid sau expirat. Te rugăm să soliciți unul nou.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="reset-page-container">
      <div className="reset-card">
        <h2>Setează o nouă parolă</h2>

        {message && (
          <div className={`reset-message reset-message--${message.type}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="reset-form">
          <div className="input-group">
            <label>Parolă nouă</label>
            <input
              type="password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="********"
              data-cy="new-password-input"
            />
          </div>

          <div className="input-group">
            <label>Confirmă parola</label>
            <input
              type="password"
              className="input-field"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="********"
              data-cy="confirm-password-input"
            />
          </div>

          <button
            type="submit"
            className="btn--primary submit-btn"
            disabled={isLoading}
            data-cy="submit-new-password-button"
          >
            {isLoading ? "Se procesează..." : "Resetează parola"}
          </button>
        </form>
      </div>
    </div>
  );
}
