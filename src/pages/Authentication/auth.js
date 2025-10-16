import { jwtDecode } from "jwt-decode";

export function getCurrentUserId() {
  try {
    const token = localStorage.getItem("authToken");
    if (!token) return null;

    const decoded = jwtDecode(token);
    return decoded?.id || null;
  } catch (error) {
    console.log("Error decoding token:", error);
    return null;
  }
}