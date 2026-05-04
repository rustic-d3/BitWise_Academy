export default function handleLogout() {
  localStorage.removeItem("authToken"); 
  window.location.href = "/login";
}
