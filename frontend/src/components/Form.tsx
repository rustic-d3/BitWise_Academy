import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

interface FormProps {
  form_type: "login" | "register";
  route: any;
}

export default function Form({ form_type, route }: FormProps) {
  const navigate = useNavigate();
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
  async function handleSubmit() {
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
    <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
      <h1 className="text-2xl font-bold text-slate-800 mb-6 text-center">
        {isRegister ? "Create an account" : "Welcome back"}
      </h1>

      <form className="flex flex-col gap-4">
        {isRegister && (
          <div className="flex gap-4">
            <div className="flex flex-col flex-1">
              <input
                placeholder="First Name"
                value={formData.first_name}
                onChange={(e) => updateField("first_name", e.target.value)}
                className="input-field"
              />
              {validationErrors.firstNameError && (
                <p className="text-red-500 text-sm">
                  {validationErrors.firstNameError}
                </p>
              )}
            </div>
            <div className="flex flex-col flex-1">
              <input
                placeholder="Last Name"
                value={formData.last_name}
                onChange={(e) => updateField("last_name", e.target.value)}
                className="input-field"
              />
              {validationErrors.lastNameError && (
                <p className="text-red-500 text-sm">
                  {validationErrors.lastNameError}
                </p>
              )}
            </div>
          </div>
        )}
        <div>
          <input
            placeholder="Username"
            value={formData.username}
            onChange={(e) => updateField("username", e.target.value)}
            className="input-field"
          />
          {validationErrors.usernameError && (
            <p className="text-red-500 text-sm">
              {validationErrors.usernameError}
            </p>
          )}
        </div>

        {isRegister && (
          <div>
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => updateField("email", e.target.value)}
              className="input-field"
            />
            {validationErrors.emailError && (
              <p className="text-red-500 text-sm">
                {validationErrors.emailError}
              </p>
            )}
          </div>
        )}

        {isRegister && (
          <div>
            <input
              type="text"
              placeholder="Phone Number"
              value={formData.phone_number}
              onChange={(e) => updateField("phone_number", e.target.value)}
              className="input-field"
            />
            {validationErrors.phoneNumberError && (
              <p className="text-red-500 text-sm">
                {validationErrors.phoneNumberError}
              </p>
            )}
          </div>
        )}
        <div>
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => updateField("password", e.target.value)}
            className="input-field"
          />

          {validationErrors.passwordError && (
            <p className="text-red-500 text-sm">
              {validationErrors.passwordError}
            </p>
          )}
        </div>
        {isRegister && (
          <p className="text-sm">
            Already have an account?{" "}
            <a className="text-red-500 text-sm" href="/login">
              Log In here!
            </a>
          </p>
        )}
        {!isRegister && (
          <p className="text-sm">
            Don't have an account?{" "}
            <a className="text-red-500 text-sm" href="/register">
              Register here!
            </a>
          </p>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          className="w-full py-2.5 px-4 bg-[#BE3455] hover:bg-[#df204c] active:bg-[#df204c] text-white font-semibold rounded-lg transition-colors cursor-pointer"
        >
          {isRegister ? "Sign Up" : "Log In"}
        </button>
      </form>
    </div>
  );
}
