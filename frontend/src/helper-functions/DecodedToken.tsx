import { jwtDecode } from "jwt-decode";

// Define the shape of your token's payload
interface DecodedToken {
  role: string;
  sub: string;
  exp: number;
}

export function getUserRole(): string | null {
  // 1. Get the token from localStorage
  const token = localStorage.getItem("access"); // Replace 'token' with your key if it's different

  if (!token) {
    return null;
  }

  try {
    // 2. Decode the token payload
    const decoded = jwtDecode<DecodedToken>(token);

    // 3. Extract and return the role
    return decoded.role || null;
  } catch (error) {
    console.error("Failed to decode token:", error);
    return null;
  }
}
