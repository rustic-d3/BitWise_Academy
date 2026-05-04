import Form from "../components/Form";

export default function Login() {
  return (
    <div className="main-container">
      {/* Left Side (Image) */}
      <div className="photo-background">
        <img src="/background_photo.png" alt="background photo" />
      </div>

      {/* Right Side (Logo + Form) */}
      <div className="form-column">
        <div className="logo-container">
          <img src="/logo.png" alt="" />
        </div>

        <Form form_type={"login"} route={"/api/token/"} />
      </div>
    </div>
  );
}
