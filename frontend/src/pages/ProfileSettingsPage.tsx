import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { getUserRole } from "../helper-functions/DecodedToken";
import api from "../api";
import "../styles/profile.scss"; // Asigură-te că ruta către fișier e corectă

export default function ProfilePage() {
  const role = getUserRole();
  const isTeacher = role === "teacher";

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    phone_number: "",
    description: "",
  });

  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("/no_avatar.png");
  const [isResetting, setIsResetting] = useState(false);

  const handlePasswordReset = async () => {
    if (!formData.email) {
      setMessage({
        type: "error",
        text: "Nu avem un email salvat pentru a trimite link-ul.",
      });
      return;
    }

    setIsResetting(true);
    setMessage(null);

    try {
      const response = await api.post("api/password-reset/", {
        email: formData.email,
      });

      if (response.status === 200) {
        setMessage({
          type: "success",
          text: "Link-ul pentru resetarea parolei a fost trimis pe email!",
        });
      }
    } catch (error) {
      console.error("Eroare la resetarea parolei:", error);
      setMessage({
        type: "error",
        text: "A apărut o eroare la trimiterea email-ului de resetare.",
      });
    } finally {
      setIsResetting(false);
    }
  };

  useEffect(() => {
    async function fetchProfileData() {
      try {
        const endpoint = isTeacher
          ? "api/teacher/profile"
          : "api/parent/profile";
        const response = await api.get(endpoint);
        console.log(response);

        if (response.status === 200) {
          const data = response.data;
          setFormData({
            email: data.email || "",
            phone_number: data.phone_number || "",
            description: data.description || "",
          });
          if (data.profile_picture) {
            setImagePreview(data.profile_picture);
            console.log(data.profile_picture);
          }
        }
      } catch (error) {
        console.error("Eroare la preluarea datelor:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProfileData();
  }, [isTeacher]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const submitData = new FormData();
    if (formData.email) submitData.append("email", formData.email);
    if (formData.phone_number)
      submitData.append("phone_number", formData.phone_number);
    if (isTeacher && formData.description)
      submitData.append("description", formData.description);
    if (profileImage) submitData.append("profile_picture", profileImage);

    try {
      const endpoint = isTeacher
        ? "api/teacher/profile-settings"
        : "api/parent/profile-settings";
      const response = await api.patch(endpoint, submitData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.status === 200 || response.status === 204) {
        setMessage({
          type: "success",
          text: "Profilul a fost actualizat cu succes!",
        });
        setFormData((prev) => ({ ...prev, password: "" }));
      }
    } catch (error: any) {
      console.error("Eroare la salvare:", error);
      const errorMsg =
        error.response?.data?.error || "A apărut o eroare la salvarea datelor.";
      setMessage({ type: "error", text: errorMsg });
    }
  };

  if (loading) {
    return <div className="loading-spinner">Încărcăm datele profilului...</div>;
  }

  return (
    <div className="page-wrapper">
      <Navbar role={role || ""} />

      <main className="main-content">
        <div className="profile-container">
          <h2 className="profile-title">Setări Profil</h2>

          {message && (
            <div
              className={`profile-message profile-message--${message.type}`}
              data-cy="reset-message"
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="profile-form" noValidate>
            {/* Secțiunea pentru poză */}
            <div className="profile-avatar-section">
              <img
                src={imagePreview}
                alt="Profile Preview"
                className="avatar-preview"
              />
              <div>
                <label htmlFor="profile_pic" className="avatar-upload-label">
                  Schimbă poza de profil
                </label>
                <input
                  type="file"
                  id="profile_pic"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="avatar-input"
                />
              </div>
            </div>

            {/* Email */}
            <div className="input-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="input-field"
                data-cy="profile-email-field"
                required
              />
            </div>

            {/* Număr de telefon */}
            <div className="input-group">
              <label>Număr de Telefon</label>
              <input
                type="text"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleInputChange}
                className="input-field"
                placeholder="+407..."
              />
            </div>

            {/* Descriere (DOAR PENTRU PROFESORI) */}
            {isTeacher && (
              <div className="input-group">
                <label>Descriere (Bio)</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="input-field textarea-field"
                  rows={4}
                />
              </div>
            )}

            {/* Resetare Parolă */}
            <div className="input-group password-section">
              <label>Securitate Cont</label>
              <p
                style={{
                  fontSize: "0.9rem",
                  color: "#6b7280",
                  marginBottom: "10px",
                }}
              >
                Pentru a-ți schimba parola, apasă pe butonul de mai jos. Îți vom
                trimite un link securizat pe adresa ta de email.
              </p>
              <button
                type="button" /* IMPORTANT: type="button" ca să nu trimită formularul mare! */
                className="btn--outline"
                onClick={handlePasswordReset}
                disabled={isResetting}
                style={{ width: "fit-content" }}
                data-cy="reset-submit-button"
              >
                {isResetting ? "Se trimite..." : "Trimite link de resetare"}
              </button>
            </div>

            <div className="submit-btn-wrapper">
              <button type="submit" className="btn--primary" data-cy="save-button">
                Salvează Modificările
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
