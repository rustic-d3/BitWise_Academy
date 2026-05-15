import { jwtDecode } from "jwt-decode";

// Define the shape of your token's payload
interface DecodedToken {
  role: string;
  sub: string;
  exp: number;
}

export function getUserRole(): string | null {
  const token = localStorage.getItem("access");

  if (!token) {
    return null;
  }

  try {
    const decoded = jwtDecode<DecodedToken>(token);

    return decoded.role.toLowerCase() || null;
  } catch (error) {
    console.error("Failed to decode token:", error);
    return null;
  }
}
