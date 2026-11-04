/** One shared signed-in user for all screens. Tokens last only for this browser tab. */
import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../services/api";
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const logout = () => {
      sessionStorage.removeItem("chefkart_token");
      setUser(null);
    };
    window.addEventListener("chefkart:session-expired", logout);
    if (sessionStorage.getItem("chefkart_token"))
      api("/auth/me")
        .then((result) => setUser(result.data))
        .catch(logout)
        .finally(() => setLoading(false));
    else setLoading(false);
    return () => window.removeEventListener("chefkart:session-expired", logout);
  }, []);
  // Both login and signup return the same shape, which keeps the forms simple.
  async function authenticate(mode, values) {
    const result = await api(`/auth/${mode}`, { method: "POST", body: values });
    sessionStorage.setItem("chefkart_token", result.token);
    setUser(result.data);
  }
  function logout() {
    sessionStorage.removeItem("chefkart_token");
    setUser(null);
  }
  return (
    <AuthContext.Provider value={{ user, loading, authenticate, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
