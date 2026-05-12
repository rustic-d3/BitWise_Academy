import "../styles/subscriptions.scss";
import "../styles/addChildForm.scss";
import Navbar from "../components/Navbar";
import { useNavigate, Navigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../api";

export default function AddChildPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [children, setChildren] = useState<any[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const [formData, setFormData] = useState({
    childName: "",
    childSurname: "",
    childAge: "",
  });

  const searchParams = new URLSearchParams(location.search);
  const cardId = searchParams.get("cardId") || searchParams.get("cardId");

  let credits = 0;
  if (cardId === "1") {
    credits = 4;
  } else if (cardId === "2") {
    credits = 12;
  }

  useEffect(() => {
    async function fetchParentData() {
      try {
        const response = await api.get("api/parent/profile");
        const parentChildren = response.data.children;
        setChildren(parentChildren);

        if (parentChildren.length > 0) {
          setSelectedChildId(parentChildren[0].id.toString());
        } else {
          setIsAddingNew(true);
        }
      } catch (error) {
        console.error("Eroare la preluarea copiilor:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchParentData();
  }, []);

  const cancel = (e: any) => {
    e.preventDefault();
    navigate("/dashboard");
  };

  const handleChange = (e: any) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (!location.state?.fromRestricted) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(event: any) {
    event.preventDefault();

    try {
      if (isAddingNew) {
        const fullName =
          `${formData.childName} ${formData.childSurname}`.trim();
        const payload = {
          full_name: fullName,
          credits: credits,
          age: formData.childAge ? parseInt(formData.childAge, 10) : null,
        };

        const response = await api.post("api/children/add/", payload);
        console.log("Child added successfully:", response.data);
      } else {
        const selectedChild = children.find(
          (c) => c.id.toString() === selectedChildId,
        );

        if (!selectedChild) return;

        const newTotalCredits = selectedChild.credits + credits;

        const response = await api.patch(
          `api/child/${selectedChild.id}/update/`,
          {
            credits: newTotalCredits,
          },
        );
        console.log("Credits updated successfully:", response.data);
      }

      navigate("/dashboard");
    } catch (error: any) {
      console.error(
        "Failed to process request:",
        error.response?.data || error.message,
      );
    }
  }

  if (loading) {
    return <div className="loading-spinner">Încărcăm datele...</div>;
  }

  return (
    <div className="page-wrapper-subscriptions">
      <Navbar role="parent" />
      <div className="main-content-subscriptions">
        <h1 className="main-title">
          {isAddingNew
            ? "Înregistrează-ți copilul pentru a putea începe!"
            : "Alege copilul căruia dorești să îi atribui creditele:"}
        </h1>

        <form method="post" className="addChildForm" onSubmit={handleSubmit}>
          {!isAddingNew && (
            <>
              <label htmlFor="childSelect">Alege un copil din listă:</label>
              <div className="selections-container">
                <select
                  id="childSelect"
                  value={selectedChildId}
                  onChange={(e) => setSelectedChildId(e.target.value)}
                  className="custom-select"
                >
                  {children.map((child) => (
                    <option key={child.id} value={child.id}>
                      {child.full_name} (Credite actuale: {child.credits})
                    </option>
                  ))}
                </select>

                <p>sau</p>

                <button
                  type="button"
                  className="btn--users--outline"
                  onClick={() => setIsAddingNew(true)}
                >
                  + Adaugă un copil nou
                </button>
              </div>
            </>
          )}

          {isAddingNew && (
            <>
              <label htmlFor="childName">Nume copil</label>
              <input
                type="text"
                name="childName"
                id="childName"
                value={formData.childName}
                onChange={handleChange}
                required={isAddingNew}
              />

              <label htmlFor="childSurname">Prenume copil</label>
              <input
                type="text"
                name="childSurname"
                id="childSurname"
                value={formData.childSurname}
                onChange={handleChange}
                required={isAddingNew}
              />

              <label htmlFor="childAge">Vârstă copil</label>
              <input
                type="text"
                name="childAge"
                id="childAge"
                value={formData.childAge}
                maxLength={2}
                onChange={(e) => {
                  e.target.value = e.target.value.replace(/\D/g, "");
                  handleChange(e);
                }}
              />

              {children.length > 0 && (
                <div className="back-button-container">
                  <button
                    type="button"
                    className="btn--users--outline"
                    onClick={() => setIsAddingNew(false)}
                  >
                    ← Înapoi la lista de copii
                  </button>
                </div>
              )}
            </>
          )}

          <div className="buttons-section">
            <button type="button" className="btn--dark" onClick={cancel}>
              <svg
                width="22"
                height="22"
                viewBox="0 0 13 13"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4.2341 3.2578C3.73837 3.35097 3.00777 4.19857 3.33017 4.52097L5.3118 6.50173L3.33017 8.4825C2.93367 8.879 4.12273 10.0668 4.51923 9.6707L6.50087 7.68993L8.4825 9.6707C8.879 10.0672 10.0676 8.87813 9.67157 8.4825L7.68993 6.50173L9.67157 4.52097C10.0681 4.12447 8.879 2.9367 8.4825 3.33277L6.50087 5.31353L4.51923 3.33277C4.44427 3.25867 4.34807 3.23613 4.2341 3.2578ZM6.5 0C2.90983 0 0 2.91027 0 6.5C0 10.0897 2.90983 13 6.5 13C10.0902 13 13 10.0897 13 6.5C13 2.91027 10.0902 0 6.5 0ZM6.5 1.625C9.1923 1.625 11.375 3.8077 11.375 6.5C11.375 9.1923 9.1923 11.375 6.5 11.375C3.8077 11.375 1.625 9.1923 1.625 6.5C1.62543 3.8077 3.8077 1.625 6.5 1.625Z"
                  fill="#FFFFFF"
                />
              </svg>
              Anulare
            </button>

            <button type="submit" className="btn--primary">
              <svg
                width="22"
                height="22"
                viewBox="0 0 25 22"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M19.028 0C19.6157 0 20.1794 0.207181 20.5951 0.575979L23.7292 3.35702C24.1449 3.72582 24.3784 4.226 24.3784 4.74756V18.6818C24.3784 20.3109 22.8901 21.6315 21.0541 21.6315H3.32432C1.48836 21.6315 0 20.3109 0 18.6818V2.94975C0 1.32065 1.48836 0 3.32432 0H19.028ZM3.32432 1.9665C2.71234 1.9665 2.21622 2.40672 2.21622 2.94975V18.6818C2.21622 19.2248 2.71234 19.665 3.32432 19.665H4.43243V13.7655C4.43243 12.1364 5.92079 10.8158 7.75676 10.8158H16.6216C18.4576 10.8158 19.9459 12.1364 19.9459 13.7655V19.665H21.0541C21.6661 19.665 22.1622 19.2248 22.1622 18.6818V5.73081C22.1622 5.20925 21.9287 4.70907 21.513 4.34028L19.487 2.54248C19.0713 2.17368 18.5076 1.9665 17.9199 1.9665H17.7297V3.933C17.7297 5.5621 16.2414 6.88276 14.4054 6.88276H9.97297C8.137 6.88276 6.64865 5.5621 6.64865 3.933V1.9665H3.32432ZM17.7297 19.665V13.7655C17.7297 13.2225 17.2336 12.7823 16.6216 12.7823H7.75676C7.14477 12.7823 6.64865 13.2225 6.64865 13.7655V19.665H17.7297ZM8.86486 1.9665H15.5135V3.933C15.5135 4.47603 15.0174 4.91625 14.4054 4.91625H9.97297C9.36099 4.91625 8.86486 4.47603 8.86486 3.933V1.9665Z"
                  fill="white"
                />
              </svg>
              {isAddingNew ? "Adaugă Copil" : "Atribuie Credite"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
