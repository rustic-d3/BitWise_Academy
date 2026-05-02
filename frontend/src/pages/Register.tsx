import Form from "../components/Form";
import "../styles/_authentication.scss";

export default function Register() {
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

        <Form form_type={"register"} route={"/api/user/register/"} />
      </div>
    </div>
  );
}
