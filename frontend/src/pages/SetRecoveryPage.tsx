import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import InfoCard from "../components/InfoCard";
import api from "../api";
import "../styles/set_recovery_page.scss";
import { useNavigate } from "react-router-dom";
import CalendarComponent from "../components/CalendarComponent";

export default function SetRecoveryPage() {
  const navigate = useNavigate();
  const [children, setChildren] = useState<any[]>([]);
  const [activeChild, setActiveChild] = useState<any>(null);
  const [activeChildTeacher, setActiveChildTeacher] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSaveSchedule = async (
    selectedDate: Date,
    selectedTime: string,
  ) => {
    if (!activeChild) return;

    setIsSaving(true);
    setMessage(null);

    const formattedDate = selectedDate.toLocaleDateString("sv-SE");

    try {
      const response = await api.post("api/lessons/create-recovery", {
        child_id: activeChild.id,
        date: formattedDate,
        time: selectedTime,
      });

      if (response.status === 201) {
        setMessage({
          type: "success",
          text: "Lecția de recuperare a fost programată cu succes!",
        });
        setTimeout(() => {
          navigate(-1);
        }, 2000);
      }
    } catch (error: any) {
      console.error("Failed to schedule makeup lesson:", error);
      const errorMsg =
        error.response?.data?.error ||
        "A apărut o eroare la programarea recuperării.";
      setMessage({ type: "error", text: errorMsg });
    } finally {
      setIsSaving(false);
    }
  };
  useEffect(() => {
    async function getParentData() {
      try {
        const response = await api.get("api/parent/profile");
        if (response.status === 200) {
          setChildren(response.data.children);
          localStorage.setItem("childrenNumber", response.data.children.length);
          setActiveChild(response.data.children[0]);
        }
      } catch (error) {
        console.error("Failed to fetch parent data:", error);
      } finally {
      }
    }

    getParentData();
  }, []);

  useEffect(() => {
    if (!activeChild) return;

    async function getChildData() {
      setActiveChildTeacher(null);

      try {
        const response = await api.get(`api/child/${activeChild.id}/`);

        if (response.status === 200) {
          const classroom = response.data.classroom;

          if (classroom) {
            setActiveChildTeacher(classroom.teacher);
          }
        }
      } catch (error) {
        console.error("Failed to fetch child data:", error);
      }
    }

    getChildData();
  }, [activeChild]);

  return (
    <div className="page-wrapper">
      <Navbar role="parent" />
      <main className="main-content">
        <div className="main-container-recovery">
          {message && (
            <div
              className={`message-banner ${message.type === "success" ? "message-success" : "message-error"}`}
              style={{
                padding: "10px 15px",
                marginBottom: "15px",
                borderRadius: "5px",
                backgroundColor:
                  message.type === "success" ? "#e6f4ea" : "#fce8e6",
                color: message.type === "success" ? "#1e8e3e" : "#d93025",
                fontWeight: 500,
              }}
            >
              {message.text}
            </div>
          )}
          <div className="row-1">
            <div className="title-container">
              <h1>Recuperare Lecție</h1>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g clip-path="url(#clip0_1_3808)">
                  <path
                    d="M2.42901 10.4694C2.43051 10.2945 2.51347 6.1689 7.47386 6.16591H18.6704L16.5284 8.30791C16.3595 8.47682 16.2549 8.71075 16.2549 8.9686C16.2549 9.48505 16.6734 9.90358 17.1899 9.90358C17.4485 9.90358 17.6817 9.79895 17.8513 9.62929L21.5882 5.89236C21.5972 5.8834 21.6002 5.87069 21.6084 5.86172C21.6824 5.78474 21.7429 5.69505 21.787 5.59565L21.7893 5.58967V5.58743C21.8274 5.49027 21.8491 5.37816 21.8491 5.26008C21.8491 5.20701 21.8446 5.15544 21.8364 5.10462L21.8371 5.10985C21.8311 5.06576 21.8237 5.02764 21.8139 4.99027L21.8154 4.997C21.7766 4.83033 21.6974 4.68608 21.5875 4.57024L21.5882 4.57099L17.8513 0.834059C17.6824 0.664403 17.4485 0.559769 17.1899 0.559769C16.6734 0.559769 16.2549 0.978304 16.2549 1.49475C16.2549 1.7526 16.3595 1.98653 16.5284 2.15544L18.6712 4.29744H7.47311C2.03663 4.30118 0.574747 8.32884 0.560547 10.4574C0.560547 10.4589 0.560547 10.4611 0.560547 10.4634C0.560547 10.9776 0.975346 11.3946 1.4888 11.3976H1.49478C2.00823 11.3976 2.42527 10.9828 2.42901 10.4694ZM22.432 12.5209C21.9268 12.5411 21.5202 12.9387 21.4881 13.4395V13.4425C21.4806 13.8827 21.2766 17.7481 16.4432 17.7511H5.24665L7.38791 15.6099C7.55757 15.441 7.6622 15.207 7.6622 14.9484C7.6622 14.432 7.24367 14.0135 6.72722 14.0135C6.46938 14.0135 6.23544 14.1181 6.06654 14.287L2.32961 18.0239C2.32064 18.0329 2.31765 18.0456 2.30943 18.0546C2.23469 18.1315 2.1734 18.222 2.12931 18.3214L2.12707 18.3274V18.3296C2.09867 18.3991 2.07849 18.4791 2.07251 18.5628V18.5658C2.07027 18.5904 2.06952 18.6196 2.06952 18.648C2.06952 18.704 2.07326 18.7594 2.08148 18.8132L2.08073 18.8072C2.10988 19.0165 2.19956 19.2011 2.3311 19.3468L2.33036 19.346L6.06728 23.083C6.23619 23.2519 6.47012 23.3565 6.72797 23.3565C7.24442 23.3565 7.66295 22.938 7.66295 22.4215C7.66295 22.1629 7.55832 21.9298 7.38866 21.7601L5.24665 19.6188H16.444C21.8812 19.6144 23.3438 15.5867 23.3573 13.4589C23.3573 13.4574 23.3573 13.4552 23.3573 13.4537C23.3573 12.9417 22.9447 12.5262 22.4335 12.5209H22.432Z"
                    fill="black"
                  />
                </g>
                <defs>
                  <clipPath id="clip0_1_3808">
                    <rect width="23.9163" height="23.9163" fill="white" />
                  </clipPath>
                </defs>
              </svg>
            </div>
            <div className="actions-container">
              <div className="buttons-section">
                {children.map((child: any) => (
                  <button
                    key={child.id}
                    className={
                      activeChild?.id === child.id
                        ? "btn--users--active"
                        : "btn--users--outline"
                    }
                    onClick={() => setActiveChild(child)}
                  >
                    {child.full_name}
                  </button>
                ))}
              </div>
              <button onClick={() => navigate(-1)}>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 15.6378L8 11.7284L12 7.81891M8 11.7284H16M22 11.7284C22 17.1262 17.5228 21.502 12 21.502C6.47715 21.502 2 17.1262 2 11.7284C2 6.33053 6.47715 1.95473 12 1.95473C17.5228 1.95473 22 6.33053 22 11.7284Z"
                    stroke="url(#paint0_linear_1_3807)"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <defs>
                    <linearGradient
                      id="paint0_linear_1_3807"
                      x1="12"
                      y1="1.95473"
                      x2="12"
                      y2="21.502"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop stop-color="#FF6116" />
                      <stop offset="1" stop-color="#FF388C" />
                    </linearGradient>
                  </defs>
                </svg>
              </button>
            </div>
          </div>
          <div className="row-2">
            <div className="col-1">
              <InfoCard data={activeChildTeacher} />
            </div>
            <div className="col-2" style={{ position: "relative" }}>
              {isSaving && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundColor: "rgba(255,255,255,0.7)",
                    zIndex: 10,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontWeight: "bold", color: "#FF6116" }}>
                    Se programează...
                  </span>
                </div>
              )}
              <CalendarComponent
                data={activeChildTeacher}
                onSave={handleSaveSchedule}
                onCancel={() => navigate(-1)}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
