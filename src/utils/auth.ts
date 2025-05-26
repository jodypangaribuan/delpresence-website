export enum UserRole {
  ADMIN = "Admin",
  LECTURER = "Dosen",
  ASSISTANT = "Asisten Dosen",
}

// Get user from localStorage
export function getUser() {
  if (typeof window === "undefined") return null;
  
  const userJson = localStorage.getItem("user");
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
  if (typeof window === "undefined") return true; // For SSR
  
  const token = localStorage.getItem("access_token");
  const expiry = localStorage.getItem("token_expiry");
  
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
  if (typeof window === "undefined") return;
  
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("token_expiry");
  localStorage.removeItem("user");
  
  window.location.href = "/login";
} 