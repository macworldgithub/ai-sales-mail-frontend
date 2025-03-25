import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const ProtectedRoute = ({ children }: any) => {
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem("x-ai-sales-mail-token"); // Check if token exists

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth/login", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return isAuthenticated ? children : null; // Return null until redirect happens
};

export default ProtectedRoute;
