export enum UserRole {
  ADMIN = "Admin",
  LECTURER = "Dosen",
  ASSISTANT = "Asisten Dosen",
}

// Safe check for browser environment with working localStorage
function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined" && typeof window.localStorage.getItem === "function";
}

// Get user from localStorage
export function getUser() {
  if (!isBrowser()) return null;

  const userJson = window.localStorage.getItem("user");
  if (!userJson) {
    return {
      id: "1",
      name: "Administrator",
      role: UserRole.ADMIN,
    };
  }

  try {
    return JSON.parse(userJson);
  } catch (e) {
    console.error("Error parsing user data:", e);
    return {
      id: "1",
      name: "Administrator",
      role: UserRole.ADMIN,
    };
  }
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  if (!isBrowser()) return false; // Not authenticated during SSR

  const token = window.localStorage.getItem("access_token");
  const expiry = window.localStorage.getItem("token_expiry");

  if (!token || !expiry) return false;

  return parseInt(expiry) > Date.now();
}

// Get user role
export function getUserRole(): UserRole {
  const user = getUser();
  if (!user) return UserRole.ADMIN; // Default for development

  switch (user.role) {
    case "Admin":
      return UserRole.ADMIN;
    case "Dosen":
      return UserRole.LECTURER;
    case "Asisten Dosen":
      return UserRole.ASSISTANT;
    default:
      return UserRole.ADMIN;
  }
}

// Logout function
export function logout() {
  if (!isBrowser()) return;

  window.localStorage.removeItem("access_token");
  window.localStorage.removeItem("refresh_token");
  window.localStorage.removeItem("token_expiry");
  window.localStorage.removeItem("user");

  window.location.href = "/login";
} 