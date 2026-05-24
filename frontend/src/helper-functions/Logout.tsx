export default function handleLogout() {
  localStorage.removeItem("authToken"); 
  sessionStorage.removeItem("glitch_chat_history");
  window.location.href = "/login";
}
