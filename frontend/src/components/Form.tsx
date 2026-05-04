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

    if (!formData.first_name.trim())
      errors.firstNameError = "First name can't be empty";
    if (!formData.last_name.trim())
      errors.lastNameError = "Last name can't be empty";
    if (!formData.username.trim())
      errors.usernameError = "Username can't be empty";
    if (!formData.email.trim()) errors.emailError = "Email can't be empty";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      errors.emailError = "Invalid email format";
    if (!formData.phone_number.trim())
      errors.phoneNumberError = "Phone number can't be empty";
    else if (!/^\+?[\d]{9,15}$/.test(formData.phone_number))
      errors.phoneNumberError = "Invalid phone number";
    if (!formData.password.trim())
      errors.passwordError = "Password can't be empty";
    else if (formData.password.length < 8)
      errors.passwordError = "Password must be at least 8 characters";

    setValidationErrors(errors);
    return !Object.values(errors).some(Boolean);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAuthError("");

    if (isRegister && !validateForm()) return;
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
      <h1 className="form-title">
        {isRegister ? "Create an account" : "Welcome"}
      </h1>

      <form onSubmit={handleSubmit} className="form-group">
        {isRegister && (
          <div className="row">
            <div className="field-wrapper">
              <label>Nume</label>
              <input
                placeholder="Nume"
                value={formData.last_name}
                onChange={(e) => updateField("last_name", e.target.value)}
              />
              {validationErrors.firstNameError && (
                <span className="error-message">
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
              />
              {validationErrors.lastNameError && (
                <span className="error-message">
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
          />
          {validationErrors.usernameError && (
            <span className="error-message">
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
            />
            {validationErrors.emailError && (
              <span className="error-message">
                {validationErrors.emailError}
              </span>
            )}
          </div>
        )}

        {isRegister && (
          <div className="field-wrapper">
            <label>Phone Number</label>
            <input
              type="text"
              placeholder="Număr de telefon"
              value={formData.phone_number}
              onChange={(e) => updateField("phone_number", e.target.value)}
            />
            {validationErrors.phoneNumberError && (
              <span className="error-message">
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
          />

          {validationErrors.passwordError && (
            <span className="error-message">
              {validationErrors.passwordError}
            </span>
          )}
        </div>

        {isRegister && (
          <p className="footer-text">
            Ai deja un cont? <a href="/login">Loghează-te aici!</a>
          </p>
        )}
        {!isRegister && (
          <p className="footer-text">
            Nu ai cont? <a href="/register">Înregistrează-te aici!</a>
          </p>
        )}
        {authError && (
          <p
            className="error-message"
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

        <button type="submit" className="submit-btn">
          {isRegister ? "Înregistrează-te" : "Log In"}
        </button>
      </form>
    </div>
  );
}
