import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "../styles/_form.scss";

interface FormProps {
  form_type: "login" | "register";
  route: any;
}

export default function Form({ form_type, route }: FormProps) {
  const navigate = useNavigate();
  const [authError, setAuthError] = useState("");
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    username: "",
    phone_number: "",
    email: "",
    password: "",
  });
  const [validationErrors, setValidationErrors] = useState({
    firstNameError: "",
    lastNameError: "",
    usernameError: "",
    emailError: "",
    phoneNumberError: "",
    passwordError: "",
  });

  function validateForm() {
    const errors = {
      firstNameError: "",
      lastNameError: "",
      usernameError: "",
      emailError: "",
      phoneNumberError: "",
      passwordError: "",
    };

    // 1. Validări COMUNE (se aplică și la Login, și la Register)
    if (!formData.username.trim()) {
      errors.usernameError = "Numele de utilizator este obligatoriu.";
    } else if (formData.username.trim().length < 3) {
      errors.usernameError =
        "Numele de utilizator trebuie să aibă minim 3 caractere.";
    }

    if (!formData.password.trim()) {
      errors.passwordError = "Parola este obligatorie.";
    }

    // 2. Validări STRICT pentru Register
    if (isRegister) {
      if (!formData.first_name.trim())
        errors.firstNameError = "Prenumele este obligatoriu.";

      if (!formData.last_name.trim())
        errors.lastNameError = "Numele este obligatoriu.";

      if (!formData.email.trim()) {
        errors.emailError = "Email-ul este obligatoriu.";
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        errors.emailError = "Formatul email-ului este invalid.";
      }

      // Validarea telefonului este acum DOAR la register
      if (!formData.phone_number.trim()) {
        errors.phoneNumberError = "Numărul de telefon este obligatoriu.";
      } else if (!/^\+[1-9]\d{7,14}$/.test(formData.phone_number)) {
        errors.phoneNumberError = "Format incorect. Exemplu: +40712345678";
      }

      // Validări complexe pentru parolă
      if (formData.password.trim()) {
        if (formData.password.length < 8) {
          errors.passwordError = "Parola trebuie să aibă minim 8 caractere.";
        } else if (!/[A-Z]/.test(formData.password)) {
          errors.passwordError =
            "Parola trebuie să conțină cel puțin o literă mare.";
        } else if (!/[0-9]/.test(formData.password)) {
          errors.passwordError = "Parola trebuie să conțină cel puțin o cifră.";
        } else if (!/[^A-Za-z0-9]/.test(formData.password)) {
          errors.passwordError =
            "Parola trebuie să conțină cel puțin un caracter special.";
        }
      }
    }

    setValidationErrors(errors);
    return !Object.values(errors).some(Boolean);
  }
  

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAuthError("");

    if (!validateForm()) return;
    const loginData = {
      username: formData.username,
      password: formData.password,
    };

    const data_to_send = form_type == "login" ? loginData : formData;

    try {
      const res = await api.post(route, data_to_send);

      if (form_type == "login") {
        localStorage.setItem("access", res.data.access);
        localStorage.setItem("refresh", res.data.refresh);
        navigate("/dashboard");
      } else {
        navigate("/login");
      }
    } catch (error: any) {
      const data = error.response?.data;

      if (typeof data === "string") {
        setAuthError(data);
      } else if (data?.detail) {
        setAuthError(data.detail);
      } else if (!data) {
        setAuthError("Network error. Please try again.");
      }

      setValidationErrors((prev) => ({
        ...prev,
        usernameError: data?.username?.[0] || "",
        emailError: data?.email?.[0] || "",
        passwordError: data?.password?.[0] || "",
        phoneNumberError: data?.phone_number?.[0] || "",
        firstNameError: data?.first_name?.[0] || "",
        lastNameError: data?.last_name?.[0] || "",
      }));
    }
  }

  const isRegister = form_type === "register";

  const updateField = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  return (
    <div className="form-container">
      <h1 className="form-title" data-cy="form-title">
        {isRegister ? "Crează un cont nou" : "Bine ai venit!"}
      </h1>

      <form
        onSubmit={handleSubmit}
        className="form-group"
        data-cy="auth-form"
        noValidate
      >
        {isRegister && (
          <div className="row">
            <div className="field-wrapper">
              <label>Nume</label>
              <input
                placeholder="Nume"
                value={formData.last_name}
                onChange={(e) => updateField("last_name", e.target.value)}
                data-cy="nameField"
              />
              {validationErrors.firstNameError && (
                <span className="error-message" data-cy="firstName-error">
                  {validationErrors.firstNameError}
                </span>
              )}
            </div>
            <div className="field-wrapper">
              <label>Prenume</label>
              <input
                placeholder="Prenume"
                value={formData.first_name}
                onChange={(e) => updateField("first_name", e.target.value)}
                data-cy="surnameField"
              />
              {validationErrors.lastNameError && (
                <span className="error-message" data-cy="lastName-error">
                  {validationErrors.lastNameError}
                </span>
              )}
            </div>
          </div>
        )}

        <div className="field-wrapper">
          <label>Nume de utilizator</label>
          <input
            placeholder="Nume de utilizator"
            value={formData.username}
            onChange={(e) => updateField("username", e.target.value)}
            data-cy="usernameField"
          />
          {validationErrors.usernameError && (
            <span className="error-message" data-cy="username-error">
              {validationErrors.usernameError}
            </span>
          )}
        </div>

        {isRegister && (
          <div className="field-wrapper">
            <label>Email</label>
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => updateField("email", e.target.value)}
              data-cy="emailField"
            />
            {validationErrors.emailError && (
              <span className="error-message" data-cy="email-error">
                {validationErrors.emailError}
              </span>
            )}
          </div>
        )}

        {isRegister && (
          <div className="field-wrapper">
            <label>Phone Number</label>
            <input
              type="tel"
              placeholder="+40712345678"
              maxLength={12} // ← +40 + 8 cifre = 13 caractere
              value={formData.phone_number}
              onChange={(e) => {
                let value = e.target.value.replace(/[^0-9+]/g, ""); // doar cifre și +

                // Auto-formatare
                if (value.startsWith("00")) {
                  value = "+" + value.slice(2);
                } else if (value.startsWith("07") || value.startsWith("02")) {
                  value = "+4" + value;
                }

                updateField("phone_number", value);
              }}
              pattern="^\+[1-9]\d{7,14}$"
              title="Format: +40712345678"
              data-cy="phoneField"
            />
            {validationErrors.phoneNumberError && (
              <span className="error-message" data-cy="phone-error">
                {validationErrors.phoneNumberError}
              </span>
            )}
          </div>
        )}

        <div className="field-wrapper">
          <label>Parolă</label>
          <input
            type="password"
            placeholder="Parolă"
            value={formData.password}
            onChange={(e) => updateField("password", e.target.value)}
            data-cy="passwordField"
          />

          {validationErrors.passwordError && (
            <span className="error-message" data-cy="password-error">
              {validationErrors.passwordError}
            </span>
          )}
        </div>

        {isRegister && (
          <p className="footer-text">
            Ai deja un cont?{" "}
            <a href="/login" data-cy="login-link">
              Loghează-te aici!
            </a>
          </p>
        )}
        {!isRegister && (
          <p className="footer-text">
            Nu ai cont?{" "}
            <a href="/register" data-cy="register-link">
              Înregistrează-te aici!
            </a>
          </p>
        )}
        {authError && (
          <p
            className="error-message"
            data-cy="login-error-message"
            style={{
              color: "#EF4444",
              fontSize: "0.875rem",
              textAlign: "center",
              margin: "0.5rem 0",
            }}
          >
            {authError}
          </p>
        )}

        <button type="submit" className="submit-btn" data-cy="submitButton">
          {isRegister ? "Înregistrează-te" : "Log In"}
        </button>
      </form>
    </div>
  );
}
