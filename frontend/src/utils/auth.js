export const AUTH_STORAGE_KEY = "facultyAuth";
export const TOKEN_STORAGE_KEY = "jwt_token";

export const isAuthenticated = () => {
  try {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    const authData = localStorage.getItem(AUTH_STORAGE_KEY);
    
    if (!token || !authData) return false;
    
    const parsed = JSON.parse(authData);
    return parsed.isAuthenticated === true && token !== null;
  } catch (error) {
    console.error("Error checking authentication:", error);
    return false;
  }
};

export const getCurrentUser = () => {
  try {
    const authData = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!authData) return null;
    
    return JSON.parse(authData);
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
};

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch (error) {
    console.error("Error getting token:", error);
    return null;
  }
};

export const logout = () => {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error("Error during logout:", error);
    return false;
  }
};

export const getUserDisplayName = () => {
  const user = getCurrentUser();
  if (!user) return "Guest";
  
  // Handle both old username format and new name format
  const displayName = user.name || user.username || "Faculty";
  return displayName.charAt(0).toUpperCase() + displayName.slice(1);
};

export const isSessionExpired = () => {
  const user = getCurrentUser();
  if (!user || !user.loginTime) return true;
  
  return false;
};

export const getLoginDuration = () => {
  const user = getCurrentUser();
  if (!user || !user.loginTime) return "Unknown";
  
  const loginTime = new Date(user.loginTime);
  const now = new Date();
  const diffMs = now - loginTime;
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
};