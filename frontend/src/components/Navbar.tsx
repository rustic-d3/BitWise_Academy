import { useEffect, useState } from "react";
import "../styles/_navbar.scss";
import handleLogout from "../helper-functions/Logout";
import { useNavigate } from "react-router-dom";
import api from "../api";

interface RoleProps {
  role: string;
}

export default function Navbar({ role }: RoleProps) {
  const isParent = role === "parent";
  const [menuOpen, setMenuOpen] = useState(false);
  const [profilePicture, setProfilePicture] = useState("/no-avatar.png");
  const [hasChildren, setHasChildren] = useState(
  localStorage.getItem("childrenNumber") != "0"
);
  const navigate = useNavigate();

  useEffect(() => {
    const getProfileImage = async () => {
      try {
        const response = await api.get("api/user/profile-picture");
        if (response.status === 200) {
          setProfilePicture(response.data.profile_picture);
        }
      } catch (error: any) {
        console.error(error);
      }
    };
    getProfileImage();
  }, []);

  const links = (
    <>
      <li>
        <a href="/dashboard">Dashboard</a>{" "}
      </li>
      {isParent && hasChildren && (
        <li>
          <a href="/set-recovery">Recuperare</a>
        </li>
      )}
      {isParent && (
        <li>
          <a href="/subscriptions">Oferte</a>
        </li>
      )}
      {!isParent && (
        <li>
          <a href="/set-schedule">Disponibilitate</a>
        </li>
      )}
    </>
  );

  return (
    <>
      <div className="nav-container">
        <div className="nav-section">
          <div className="left-side">
            <div className="image-container">
              <img src="/public/logo.png" alt="logo" />
            </div>
            <nav className="nav-links">
              <ul>{links}</ul>
            </nav>
          </div>
          <div className="right-side">
            <button className="btn--outline" onClick={() => handleLogout()}>
              Delogare
            </button>
            <div className="personal-photo">
              <img src={profilePicture} alt="avatar" />
            </div>
            <button onClick={() => navigate("/profile-settings")}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 33 33"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M28.9701 16.5C28.9701 17.2182 28.9041 17.952 28.7702 18.6858L32.3827 21.8169L28.9546 27.6753L24.3967 26.1554C23.2456 27.1105 21.9333 27.8637 20.5493 28.3625L19.6098 33H12.7729L11.8334 28.3645C10.4338 27.8637 9.1449 27.1221 7.98408 26.1573L3.42813 27.6753L0 21.8169L3.61254 18.6858C3.47858 17.952 3.41258 17.2182 3.41258 16.5C3.41258 15.7818 3.47858 15.048 3.61252 14.3142L0 11.1831L3.42812 5.32465L7.986 6.84459C9.13712 5.88954 10.4493 5.13635 11.8334 4.63746L12.7729 0H19.6098L20.5493 4.63554C21.9469 5.13635 23.2378 5.87788 24.3986 6.84265L28.9546 5.32271L32.3827 11.1812L28.7702 14.3123C28.9041 15.048 28.9701 15.7818 28.9701 16.5ZM16.1913 9.70588C12.4449 9.70588 9.39721 12.7535 9.39721 16.5C9.39721 20.2465 12.4449 23.2941 16.1913 23.2941C19.9378 23.2941 22.9854 20.2465 22.9854 16.5C22.9854 12.7535 19.9378 9.70588 16.1913 9.70588Z"
                  fill="#FF6116"
                />
              </svg>
            </button>

            {/* hamburger - mobile only */}
            <div
              className="nav-hamburger"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <span />
              <span />
              <span />
            </div>
          </div>
        </div>
      </div>

      {/* mobile dropdown */}
      <div className={`nav-mobile-menu ${menuOpen ? "open" : ""}`}>
        <ul>{links}</ul>
      </div>
    </>
  );
}
