import { useState } from "react";

interface FormProps {
  form_type: "login" | "register";
}

export default function Form({ form_type }: FormProps) {
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    username: "",
    phoneNumber: "",
    email: "",
    password: "",
  });

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
              value={formData.firstname}
              onChange={(e) => updateField("firstname", e.target.value)}
              className="input-field flex-1"
            />
            <input
              placeholder="Last Name"
              value={formData.lastname}
              onChange={(e) => updateField("lastname", e.target.value)}
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
            value={formData.phoneNumber}
            onChange={(e) => updateField("phoneNumber", e.target.value)}
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
          onClick={() => console.log(formData)}
          className="w-full py-2.5 px-4 bg-[#BE3455] hover:bg-[#df204c] active:bg-[#df204c] text-white font-semibold rounded-lg transition-colors cursor-pointer"
        >
          {isRegister ? "Sign Up" : "Log In"}
        </button>
      </form>
    </div>
  );
}
