import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { loading } = useAuth();
  const location = useLocation();
  const token = localStorage.getItem("token");

  if (loading) {
    return (
      <div className="page-center">
        <div className="card">Loading...</div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
};

export default ProtectedRoute;
