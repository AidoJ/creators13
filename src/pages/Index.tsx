import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) return null;

  // Logged-in users go to dashboard, everyone else to enrollment
  return <Navigate to={user ? "/dashboard" : "/enroll"} replace />;
};

export default Index;
