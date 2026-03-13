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
    <div>
      <h2>{isRegister ? "Register" : "Login"}</h2>
      <form>
        {isRegister && (
          <>
            <input
              placeholder="First Name"
              value={formData.firstname}
              onChange={(e) => updateField("firstname", e.target.value)}
            />
            <input
              placeholder="Last Name"
              value={formData.lastname}
              onChange={(e) => updateField("lastname", e.target.value)}
            />
          </>
        )}

        <input
          placeholder="Username"
          value={formData.username}
          onChange={(e) => updateField("username", e.target.value)}
        />

        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => updateField("email", e.target.value)}
        />

        {isRegister && (
          <input
            type="text"
            placeholder="Phone Number"
            value={formData.phoneNumber}
            onChange={(e) => updateField("phoneNumber", e.target.value)}
          />
        )}

        <input
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={(e) => updateField("password", e.target.value)}
        />

        <button type="button" onClick={() => console.log(formData)}>
          {isRegister ? "Sign Up" : "Log In"}
        </button>
      </form>
    </div>
  );
}
