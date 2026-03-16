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

  async function handleSubmit() {
    console.log(route);
    console.log(formData);

    const loginData = {
      username: formData.username,
      password: formData.password,
    };

    const data_to_send = form_type == "login" ? loginData : formData;

    try {
      const res = await api.post(route, data_to_send);
      console.log(res.data);

      if (form_type == "login") {
        localStorage.setItem("access", res.data.access);
        localStorage.setItem("refresh", res.data.refresh);
        navigate("/dashboard");
      } else {
        navigate("/login");
      }
    } catch (error) {
      alert(error);
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
            <input
              placeholder="First Name"
              value={formData.first_name}
              onChange={(e) => updateField("first_name", e.target.value)}
              className="input-field flex-1"
            />
            <input
              placeholder="Last Name"
              value={formData.last_name}
              onChange={(e) => updateField("last_name", e.target.value)}
              className="input-field flex-1"
            />
          </div>
        )}

        <input
          placeholder="Username"
          value={formData.username}
          onChange={(e) => updateField("username", e.target.value)}
          className="input-field"
        />

        {isRegister && (
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => updateField("email", e.target.value)}
            className="input-field"
          />
        )}

        {isRegister && (
          <input
            type="text"
            placeholder="Phone Number"
            value={formData.phone_number}
            onChange={(e) => updateField("phone_number", e.target.value)}
            className="input-field"
          />
        )}

        <input
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={(e) => updateField("password", e.target.value)}
          className="input-field"
        />

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
